import { Skeleton } from "@/src/components/SkeletonProvider"

export default function DashboardLoading() {
    return (
        <Skeleton name="dashboard" loading={true}>
            <></>
        </Skeleton>
    )
}
