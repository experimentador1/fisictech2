export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with{' '}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Next.js
            </a>{' '}
            and{' '}
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Tailwind CSS
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}