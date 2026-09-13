import { Link, useNavigate } from "@tanstack/react-router";
import { Droplet, Menu } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", label: "Find a donor" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/privacy", label: "Privacy & consent" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          activeProps={{ className: "bg-accent text-accent-foreground" }}
          activeOptions={{ exact: item.to === "/" }}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="Blood Management Registry home">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplet className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm leading-tight font-semibold sm:text-base">
            Blood Management
            <span className="block text-xs font-normal text-muted-foreground">Donor registry</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLinks />
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/portal">Donor portal</Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/register">Register as donor</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="ml-auto md:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="px-4 pt-4">Menu</SheetTitle>
            <div className="flex flex-col gap-1 p-4">
              <NavLinks onNavigate={() => setOpen(false)} />
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                Register as donor
              </Link>
              {user ? (
                <>
                  <Link
                    to="/portal"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    Donor portal
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                    >
                      Admin
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setOpen(false);
                      void signOut();
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <Button asChild className="mt-2" onClick={() => setOpen(false)}>
                  <Link to="/auth">Sign in</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
