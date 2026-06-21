import { useListAiProviders, useSetActiveProvider, getListAiProvidersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, Power } from "lucide-react";

export default function AiProviders() {
  const { data: providers = [] } = useListAiProviders();
  const setActive = useSetActiveProvider();
  const queryClient = useQueryClient();

  const handleActivate = (id: string) => {
    setActive.mutate({ data: { providerId: id } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAiProvidersQueryKey() })
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Cpu className="w-8 h-8 text-primary" />
          Processing Units
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <Card 
            key={provider.id} 
            className={`p-6 border-2 transition-all ${
              provider.isActive 
                ? 'bg-primary/5 border-primary shadow-[0_0_30px_-10px] shadow-primary/30' 
                : 'bg-card/50 border-border/50 hover:border-border'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl">{provider.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">{provider.model}</p>
              </div>
              <Badge variant={provider.isActive ? 'default' : provider.status === 'mock' ? 'outline' : 'secondary'}>
                {provider.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground font-mono text-[10px]">
                REQS: {provider.requestCount.toLocaleString()}
              </span>
              <Button 
                variant={provider.isActive ? "default" : "outline"}
                size="sm"
                className={provider.isActive ? "bg-primary text-primary-foreground pointer-events-none" : ""}
                onClick={() => !provider.isActive && handleActivate(provider.id)}
                disabled={!provider.isConfigured && provider.status !== 'mock'}
              >
                <Power className="w-3 h-3 mr-2" />
                {provider.isActive ? 'Active' : 'Initialize'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
