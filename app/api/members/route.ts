import { prisma } from "@/lib/prisma";
import { getAuthGym, checkRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MemberStatus } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { MemberService } from "@/src/modules/members/service";
import { memberSchema } from "@/src/modules/members/validator";

export async function GET(req: Request) {
  try {
    const auth = await getAuthGym();
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // TRAINER should not access the full member list with subscription/financial data.
    // Trainers use the schedule endpoint for their limited member lookups.
    const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK']);
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const dobMonth = searchParams.get("dobMonth");
    const birthday = searchParams.get("birthday");
    const duration = searchParams.get("duration");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const rawTake = parseInt(searchParams.get("take") || "10");
    const take = Math.min(Math.max(rawTake, 1), 1000); // Clamp pagination to block abuse
    const skip = (page - 1) * take;

    const andFilters: any[] = [
      { gymId: auth.gym.id },
      { deletedAt: null }
    ];

    if (q) {
      andFilters.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const now = new Date()

    if (status && status !== "ALL") {
      if (status === "EXPIRED") {
        // Find members that either have DB status EXPIRED OR are ACTIVE but their latest subscription has ended
        andFilters.push({
          OR: [
            { status: "EXPIRED" },
            {
              AND: [
                { status: "ACTIVE" },
                {
                  subscriptions: {
                    some: {
                      endDate: { lt: now }
                    }
                  }
                },
                // And they do NOT have any active subscription ending in the future
                {
                  NOT: {
                    subscriptions: {
                      some: {
                        endDate: { gte: now }
                      }
                    }
                  }
                }
              ]
            }
          ]
        });
      } else if (status === "ACTIVE") {
        // ACTIVE in DB AND have a subscription ending in the future or no subscription yet?
        // Let's just say ACTIVE means DB status ACTIVE and (no sub or latest sub is not expired)
        andFilters.push({
          status: "ACTIVE",
          NOT: {
            AND: [
              {
                subscriptions: {
                  some: { endDate: { lt: now } }
                }
              },
              {
                NOT: {
                  subscriptions: {
                    some: { endDate: { gte: now } }
                  }
                }
              }
            ]
          }
        });
      } else {
        andFilters.push({ status: status as MemberStatus });
      }
    }

    if (duration && duration !== "ALL") {
      andFilters.push({
        subscriptions: {
          some: {
            plan: {
              duration: parseInt(duration),
            },
            status: "ACTIVE",
          },
        },
      });
    }

    // Birthday Month Filter
    if (dobMonth && dobMonth !== "ALL") {
      const parsedMonth = Number.parseInt(dobMonth, 10);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return NextResponse.json(
          { error: "Invalid dobMonth. Must be between 1 and 12." },
          { status: 400 }
        );
      }
      const membersWithMonth = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Member" 
        WHERE EXTRACT(MONTH FROM "dateOfBirth" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${parsedMonth}
        AND "gymId" = ${auth.gym.id}
        AND "deletedAt" IS NULL
      `;
      const ids = membersWithMonth.map((m) => m.id);
      andFilters.push({ id: { in: ids } });
    }

    // Today's Birthday Filter
    if (birthday === "today") {
      // Robust timezone support instead of hardcoded 330 offset
      const timezone = auth.gym.timezone || "Asia/Kolkata";
      const localDateStr = formatInTimeZone(new Date(), timezone, "MM-dd");
      const [monthStr, dayStr] = localDateStr.split('-');
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      const birthdaysToday = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Member" 
        WHERE EXTRACT(MONTH FROM "dateOfBirth" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${month}
        AND EXTRACT(DAY FROM "dateOfBirth" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = ${day}
        AND "gymId" = ${auth.gym.id}
        AND "deletedAt" IS NULL
      `;
      const ids = birthdaysToday.map((m) => m.id);
      andFilters.push({ id: { in: ids } });
    }

    const where = { AND: andFilters };

    const [members, totalCount] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          subscriptions: {
            where: { deletedAt: null },
            orderBy: { endDate: "desc" },
            take: 1,
            select: { endDate: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.member.count({ where }),
    ]);

    const formattedMembers = members.map((member) => {
      const latestEndDate = member.subscriptions[0]?.endDate || null

      // If DB says ACTIVE but the latest sub has expired, treat as EXPIRED
      let effectiveStatus: string = member.status
      if (member.status === 'ACTIVE' && latestEndDate && latestEndDate < now) {
        effectiveStatus = 'EXPIRED'
      }

      return {
        ...member,
        status: effectiveStatus,
        subscriptionEndDate: latestEndDate,
      }
    })

    return NextResponse.json({
      members: formattedMembers,
      totalCount,
      hasMore: totalCount > skip + take,
      page,
      take,
    })
  } catch (error: any) {
    console.error("[MEMBERS_GET]", error);
    return new NextResponse("Internal server error while fetching members.", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthGym();
    if (!auth || !auth.gym || typeof auth.userId !== 'string') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = memberSchema.parse(body);

    const headerList = req.headers;
    const ipHeader = headerList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

    const result = await MemberService.createMember(
        auth.gym.id,
        { 
            name: auth.gym.name, 
            phone: auth.gym.phone,
            address: '',
            invoiceLinkExpiryDays: 30,
            saasPlan: auth.gym.saasPlan,
        },
        auth.userId,
        ip,
        validatedData
    );


    if (result.error) {
        return new NextResponse(result.error, { status: 400 });
    }

    return NextResponse.json({ id: result.id, success: true });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
        return new NextResponse("Validation error: " + error.message, { status: 400 });
    }
    // TOCTOU cap: thrown from inside the transaction when the limit is hit concurrently
    if (error?.message?.startsWith('MEMBER_CAP:')) {
        const [, limit, plan] = error.message.split(':')
        return new NextResponse(
            `Member limit reached. Your ${plan === 'MAIN_PLAN' ? '₹12,000 plan' : 'plan'} allows up to ${limit} members. Contact GymMitra to upgrade.`,
            { status: 400 }
        )
    }
    console.error("[MEMBERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
