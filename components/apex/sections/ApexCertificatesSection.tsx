import React, { useEffect, useState } from 'react';
import type { ApexCertificateTemplate, Course, User } from '../../../types';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import { listApexCertificateTemplates, tryIssueCertificateRecord } from '../../../services/apexLearningService';
import { downloadApexCertificatePdf } from '../../../services/apexCertificatePdf';

export type ApexCertificatesSectionProps = {
  isFr: boolean;
  courses: Course[];
  users: User[];
};

export const ApexCertificatesSection: React.FC<ApexCertificatesSectionProps> = ({ isFr, courses, users }) => {
  const [templates, setTemplates] = useState<ApexCertificateTemplate[]>([]);

  useEffect(() => {
    void listApexCertificateTemplates().then(setTemplates);
  }, []);

  const verifyBase =
    typeof window !== 'undefined' ? `${window.location.origin}/verify/certificate` : 'https://app.coya.pro/verify/certificate';

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Certification sécurisée' : 'Secure certification'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Templates : modèles, branding, QR, signatures, numérotation. Conditions exemple : progression &gt; 80 %, examen validé, présence &gt; 90 %. Vérification publique : URL traçable.'
            : 'Templates: layouts, branding, QR, signatures, numbering. Sample rules: progress &gt; 80%, exam pass, attendance &gt; 90%. Public verification URL.'}
        </p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] text-slate-700">
          <span className="text-slate-500">{isFr ? 'Endpoint vérif.' : 'Verify endpoint'}: </span>
          {verifyBase}/{'{id}'}
        </div>
      </div>

      <div className={`space-y-4 ${APEX_SHELL_CARD} p-6`}>
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {isFr
            ? 'PDF : branchement production `learning_certificates` + stockage signé (certificateUrl).'
            : 'PDF: production wiring to `learning_certificates` + signed storage.'}
        </p>
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id} className="space-y-2 rounded-lg border border-slate-100 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{t.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    void tryIssueCertificateRecord({
                      courseId: courses[0]?.id || '',
                      userId: users[0]?.id?.toString() || '',
                      templateId: t.id,
                      quizPassed: true,
                      attendanceOk: true,
                    });
                    await downloadApexCertificatePdf({
                      template: t,
                      learnerName: users[0]?.fullName || users[0]?.name,
                      courseTitle: courses[0]?.title,
                      fr: isFr,
                    });
                  }}
                >
                  {isFr ? 'Tester le PDF' : 'Test PDF'}
                </Button>
              </div>
              <pre className="max-h-32 overflow-auto rounded bg-slate-900/90 p-2 text-[10px] text-slate-100">
                {JSON.stringify(t.body, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
