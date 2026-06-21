import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
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

const queryClient = new QueryClient();

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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
