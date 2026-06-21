import { useListTeamMembers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Team() {
  const { data: team = [] } = useListTeamMembers();
  
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Personnel Roster
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => (
          <Card key={member.id} className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{member.fullName}</h3>
                <p className="text-sm text-muted-foreground">{member.position}</p>
              </div>
              <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="bg-primary/10 text-primary">
                {member.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              {member.department}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
