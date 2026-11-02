import type { Metadata } from "next";
import { getAnalyticsDashboardData, type DateFilterType } from "@/lib/data/analytics";
import { AnalyticsView } from "@/components/admin/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Orders Analytics · Admin · College Bites",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    startDate?: string;
    endDate?: string;
    restaurant?: string;
  }>;
}) {
  const params = await searchParams;

  const dateFilter = (params.date as DateFilterType) || "today";
  const analyticsData = await getAnalyticsDashboardData({
    dateFilter,
    startDate: params.startDate,
    endDate: params.endDate,
    restaurantId: params.restaurant,
  });

  return <AnalyticsView data={analyticsData} />;
}