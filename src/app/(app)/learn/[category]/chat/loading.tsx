import { RoomBrowserSkeleton } from "@/components/language/rooms/RoomBrowser";
import { PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (<><PageHeaderSkeleton /><RoomBrowserSkeleton /></>);
}
