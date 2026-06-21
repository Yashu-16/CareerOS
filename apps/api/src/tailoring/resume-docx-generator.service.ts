import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  BorderStyle,
} from 'docx';
import { TailoredResumeContent, ProfileSnapshot } from './tailoring-ai.service';

@Injectable()
export class ResumeDocxGeneratorService {
  async generate(profile: ProfileSnapshot, content: TailoredResumeContent): Promise<Buffer> {
    const children: Paragraph[] = [];

    // Header: name + contact line
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: profile.fullName, bold: true, size: 36 })],
        spacing: { after: 60 },
      }),
    );
    if (profile.headline) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: profile.headline, size: 22, color: '555555' })],
          spacing: { after: 200 },
        }),
      );
    }

    // Summary
    children.push(this.sectionHeading('Professional Summary'));
    children.push(new Paragraph({ children: [new TextRun(content.summary)], spacing: { after: 200 } }));

    // Skills
    children.push(this.sectionHeading('Skills'));
    children.push(
      new Paragraph({
        children: [new TextRun(content.orderedSkills.join('  •  '))],
        spacing: { after: 200 },
      }),
    );

    // Experience
    if (content.experienceBullets.length > 0) {
      children.push(this.sectionHeading('Experience'));
      for (const exp of content.experienceBullets) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${exp.title} — ${exp.company}`, bold: true, size: 24 }),
            ],
            spacing: { before: 120, after: 60 },
          }),
        );
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              numbering: { reference: 'resume-bullets', level: 0 },
              children: [new TextRun(bullet)],
            }),
          );
        }
      }
    }

    // Projects
    if (content.projectHighlights.length > 0) {
      children.push(this.sectionHeading('Projects'));
      for (const proj of content.projectHighlights) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
            spacing: { before: 120, after: 60 },
          }),
        );
        for (const bullet of proj.bullets) {
          children.push(
            new Paragraph({
              numbering: { reference: 'resume-bullets', level: 0 },
              children: [new TextRun(bullet)],
            }),
          );
        }
      }
    }

    // Education
    if (profile.education.length > 0) {
      children.push(this.sectionHeading('Education'));
      for (const edu of profile.education) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree}${edu.fieldOfStudy ? ', ' + edu.fieldOfStudy : ''}`, bold: true }),
              new TextRun({ text: ` — ${edu.institution}` }),
            ],
            spacing: { before: 80 },
          }),
        );
      }
    }

    // Certifications
    if (profile.certifications.length > 0) {
      children.push(this.sectionHeading('Certifications'));
      for (const cert of profile.certifications) {
        children.push(
          new Paragraph({
            numbering: { reference: 'resume-bullets', level: 0 },
            children: [new TextRun(`${cert.name}${cert.issuer ? ' — ' + cert.issuer : ''}`)],
          }),
        );
      }
    }

    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
      },
      numbering: {
        config: [
          {
            reference: 'resume-bullets',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '•',
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 360, hanging: 240 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 720, right: 1080, bottom: 720, left: 1080 },
            },
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  private sectionHeading(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 26, color: '1A1A2E' })],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6', space: 1 },
      },
      spacing: { before: 200, after: 100 },
    });
  }
}
