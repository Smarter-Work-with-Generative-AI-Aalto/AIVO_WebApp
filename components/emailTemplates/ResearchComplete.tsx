import {
  Button,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import EmailLayout from './EmailLayout';
import app from '@/lib/app';
import env from '@/lib/env';

interface ResearchCompleteEmailProps {
  subject: string;
  resultId: string;
  teamSlug: string;
}

const ResearchCompleteEmail = ({ subject, resultId, teamSlug }: ResearchCompleteEmailProps) => {
  const viewResultsLink = `${env.appUrl}/teams/${teamSlug}/ai-result?id=${resultId}`;

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <EmailLayout>
        <Text>Your research results are ready on AIVO!</Text>
        <Text>
          The AIVO research process has been completed and your results are now available to view.
          Click the button below to access your research results.
        </Text>
        <Container className="text-center">
          <Button
            href={viewResultsLink}
            className="bg-brand text-white font-medium py-2 px-4 rounded"
          >
            View Research Results
          </Button>
        </Container>
        <Text>
          You can also find this and all your previous research results in your activity log.
        </Text>
      </EmailLayout>
    </Html>
  );
};

export default ResearchCompleteEmail; 