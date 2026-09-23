import { useQuery } from '@apollo/client';
import { GET_CONTRIBUTOR_DASHBOARD } from '@/graphql/queries';
import { ContributorDashboard } from '@/components/dashboard/ContributorDashboard';

export const ContributorDashboardClient = () => {
  const { data, loading, error } = useQuery(GET_CONTRIBUTOR_DASHBOARD);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;

  return <ContributorDashboard data={data} />;
};
