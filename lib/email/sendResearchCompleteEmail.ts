import { render } from '@react-email/render';
import { sendEmail } from './sendEmail';
import ResearchCompleteEmail from '@/components/emailTemplates/ResearchComplete';
import app from '../app';

export const sendResearchCompleteEmail = async (
  email: string,
  resultId: string,
  teamSlug: string
) => {
  const subject = `Your ${app.name} Research Results are Ready`;

  const html = render(ResearchCompleteEmail({ subject, resultId, teamSlug }));

  await sendEmail({
    to: email,
    subject,
    html,
  });
}; 