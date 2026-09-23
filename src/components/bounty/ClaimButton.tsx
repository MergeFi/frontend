import { Button } from '@/components/ui/Button';
import { useClaimBounty } from '@/hooks/useClaimBounty';

export const ClaimButton = ({ bountyId }: { bountyId: string }) => {
  const { claimBounty } = useClaimBounty();

  return (
    <Button onClick={() => claimBounty(bountyId)}>Claim</Button>
  );
};
