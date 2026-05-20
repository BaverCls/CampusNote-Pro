import { useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Coins, HelpCircle, Shield, UploadCloud } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

function HelpSection({ icon: Icon, title, children }: { icon: ElementType; title: string; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{children}</div>
    </section>
  );
}

export function HelpPage() {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar activeItem="Help" onProfileClick={() => navigate('/profile')} />
      <Header onProfileClick={() => navigate('/profile')} onMobileMenuClick={() => setIsMobileNavOpen(true)} />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeItem="Help"
        onProfileClick={() => navigate('/profile')}
      />

      <main className="lg:ml-64 pt-16">
        <div className="mx-auto p-4 lg:p-8" style={{ maxWidth: "clamp(900px, 85%, 1100px)" }}>
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-slate-900 dark:text-white">Help & Demo Guide</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
              A quick guide for the CampusNote Pro final demo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpSection icon={BookOpen} title="What is CampusNote Pro?">
              CampusNote Pro is an academic note sharing platform for Istanbul Arel University students. Students can upload notes, discover published documents, and track their contribution progress.
            </HelpSection>

            <HelpSection icon={UploadCloud} title="How upload review works">
              Uploaded documents enter a review flow. Published documents become visible to students, flagged documents need admin attention, and rejected documents are not published.
            </HelpSection>

            <HelpSection icon={Coins} title="How CampusCoins work">
              CampusCoins reflect contribution activity. Published notes can reward students, and the leaderboard highlights top contributors without using fake metrics.
            </HelpSection>

            <HelpSection icon={Bell} title="Notifications">
              Notifications keep users informed about document review outcomes and moderation updates. The notification center shows read and unread items.
            </HelpSection>

            <HelpSection icon={Shield} title="Admin moderation">
              Admins can review notes, filter by status, inspect reported or flagged documents, and manage account suspension where supported by the backend.
            </HelpSection>

            <HelpSection icon={HelpCircle} title="Current prototype limitations">
              External ML integration is planned. AWS S3 storage is planned. The current prototype uses the existing backend review and storage flow for the final demo.
            </HelpSection>
          </div>
        </div>
      </main>
    </div>
  );
}
