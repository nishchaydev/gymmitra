import { prisma } from "@/lib/prisma";
import { getAuthGym } from "@/lib/auth";
import { NextResponse } from "next/server";
import { MemberStatus } from "@prisma/client";
import { addMonths } from "date-fns";

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
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
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
    if (!auth) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      email,
      dateOfBirth,
      joiningDate,
      pincode,
      state,
      city,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      planId,
      amountPaid,
    } = body;

    if (!name || !phone || !dateOfBirth) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        email,
        dateOfBirth: new Date(dateOfBirth),
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        pincode,
        state,
        city,
        emergencyName: emergencyName || "N/A",
        emergencyPhone: emergencyPhone || "N/A",
        emergencyRelation: emergencyRelation || "N/A",
        gymId: auth.gym.id,
      },
    });

    if (planId) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
      });

      if (plan) {
        const startDate = joiningDate ? new Date(joiningDate) : new Date();
        const endDate = addMonths(startDate, plan.duration);

        await prisma.memberSubscription.create({
          data: {
            memberId: member.id,
            planId: plan.id,
            gymId: auth.gym.id,
            startDate,
            endDate,
            price: plan.price,
            status: "ACTIVE",
            paymentStatus:
              amountPaid >= Number(plan.price) ? "PAID" : "PARTIAL",
          },
        });
      }
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("[MEMBERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

