import Link from "next/link";
import { PayrollHeroIllustration } from "../../components/Illustrations";

export default function Home() {
  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8 rounded-[2rem] border border-sage/30 bg-pakistan-green/92 p-8 shadow-[0_24px_80px_rgba(20,49,9,0.28)] backdrop-blur-xl sm:p-10">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal-purple text-sm font-semibold text-lavender shadow-lg shadow-black/20">
              W
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sage">
                Workora
              </p>
              <p className="text-sm text-gray">Payroll and attendance workspace</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-lavender sm:text-5xl">
              A focused workspace for payroll, attendance, and team operations.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-gray">
              Clean workflows on the inside, strong contrast on the outside.
              Sign in to manage employees, leave, attendance, and payroll in one place.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full bg-royal-purple px-5 text-lavender transition-colors hover:bg-eminence md:w-[180px]"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-sage/40 px-5 text-lavender transition-colors hover:bg-royal-purple/10 md:w-[180px]"
              href="/login"
            >
              Open workspace
            </Link>
          </div>
        </section>

        <section className="flex justify-center">
          <div className="w-full max-w-[640px] rounded-[2rem] border border-sage/30 bg-pakistan-green/88 p-4 shadow-[0_24px_80px_rgba(20,49,9,0.24)] backdrop-blur-sm">
            <PayrollHeroIllustration className="h-auto w-full" />
          </div>
        </section>
      </div>
    </main>
  );
}
