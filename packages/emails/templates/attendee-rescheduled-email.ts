import { renderEmail } from "../";
import generateIcsFile, { GenerateIcsRole } from "../lib/generateIcsFile";
import AttendeeScheduledEmail from "./attendee-scheduled-email";

export default class AttendeeRescheduledEmail extends AttendeeScheduledEmail {
  protected async getNodeMailerPayload(): Promise<Record<string, unknown>> {
    return {
      icalEvent: generateIcsFile({
        calEvent: this.calEvent,
        title: this.t("event_type_has_been_rescheduled"),
        subtitle: this.t("emailed_you_and_any_other_attendees"),
        role: GenerateIcsRole.ATTENDEE,
        status: "CONFIRMED",
      }),
      to: `${this.attendee.name} <${this.attendee.email}>`,
      from: `${this.calEvent.organizer.name} <${this.getMailerOptions().from}>`,
      replyTo: [...this.calEvent.attendees.map(({ email }) => email), this.calEvent.organizer.email],
      subject: `${this.attendee.language.translate("event_type_has_been_rescheduled_on_time_date", {
        title: this.calEvent.title,
        date: this.getFormattedDate(),
      })}`,
      html: await renderEmail("AttendeeRescheduledEmail", {
        calEvent: this.calEvent,
        attendee: this.attendee,
      }),
      text: this.getTextBody("event_has_been_rescheduled", "emailed_you_and_any_other_attendees"),
    };
  }
}
