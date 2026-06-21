import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Chats from "@/pages/chats";
import Memory from "@/pages/memory";
import Tasks from "@/pages/tasks";
import Reminders from "@/pages/reminders";
import Team from "@/pages/team";
import Documents from "@/pages/documents";
import AiProviders from "@/pages/ai-providers";
import Settings from "@/pages/settings";
import TelegramSetup from "@/pages/telegram-setup";
import Personal from "@/pages/personal";
import Collections from "@/pages/collections";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <p className="text-6xl">404</p>
      <p className="text-lg">Page not found</p>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chats" component={Chats} />
        <Route path="/memory" component={Memory} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/team" component={Team} />
        <Route path="/documents" component={Documents} />
        <Route path="/ai" component={AiProviders} />
        <Route path="/settings" component={Settings} />
        <Route path="/telegram" component={TelegramSetup} />
        <Route path="/personal" component={Personal} />
        <Route path="/collections" component={Collections} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}
