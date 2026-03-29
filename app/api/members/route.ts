import { prisma } from "@/lib/prisma";
import { getAuthGym } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MemberStatus } from "@prisma/client";
import { MemberService } from "@/src/modules/members/service";
import { memberSchema } from "@/src/modules/members/validator";

export async function GET(req: Request) {
  try {
    const auth = await getAuthGym();
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const dobMonth = searchParams.get("dobMonth");
    const birthday = searchParams.get("birthday");
    const duration = searchParams.get("duration");
    const page = parseInt(searchParams.get("page") || "1");
    const take = parseInt(searchParams.get("take") || "10");
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

    if (status && status !== "ALL") {
      andFilters.push({ status: status as MemberStatus });
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
      const monthNum = parseInt(dobMonth);
      const membersWithMonth = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Member" 
        WHERE EXTRACT(MONTH FROM "dateOfBirth") = ${monthNum}
        AND "gymId" = ${auth.gym.id}
        AND "deletedAt" IS NULL
      `;
      const ids = membersWithMonth.map((m) => m.id);
      andFilters.push({ id: { in: ids } });
    }

    // Today's Birthday Filter
    if (birthday === "today") {
      // Use IST offset (+5:30) to get correct date for Indian users
      const nowUtc = new Date();
      const istOffset = 330; // IST is UTC+5:30 = 330 minutes
      const istDate = new Date(nowUtc.getTime() + istOffset * 60 * 1000);
      const month = istDate.getUTCMonth() + 1;
      const day = istDate.getUTCDate();
      const birthdaysToday = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Member" 
        WHERE EXTRACT(MONTH FROM "dateOfBirth") = ${month}
        AND EXTRACT(DAY FROM "dateOfBirth") = ${day}
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

    const now = new Date()

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
    return new NextResponse(`Internal error: ${error?.message || error}`, { status: 500 });
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
            address: '', // Since the GET endpoint is not passing full gym settings, provide fallbacks
            invoiceLinkExpiryDays: 30
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
    console.error("[MEMBERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

