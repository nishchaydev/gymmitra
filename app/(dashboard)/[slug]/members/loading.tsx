import { Skeleton } from "@/src/components/SkeletonProvider"

export default function MembersLoading() {
    return (
        <Skeleton name="members" loading={true}>
            <></>
        </Skeleton>
    )
}
