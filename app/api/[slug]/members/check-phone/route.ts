import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthGym, checkRole } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const auth = await getAuthGym();

    if (!auth || auth.gym.slug !== slug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only staff, trainers, and owners can check for duplicates
    const roleError = checkRole(auth, ['OWNER', 'STAFF', 'TRAINER']);
    if (roleError) return roleError;

    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: {
        gymId: auth.gym.id,
        phone: phone,
      },
      select: {
        id: true,
      }
    });

    return NextResponse.json({ exists: !!member });

  } catch (error) {
    console.error("Error checking phone duplicate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
