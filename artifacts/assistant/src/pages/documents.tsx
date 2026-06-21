import { useListDocuments } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { FileText, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Documents() {
  const { data: docs = [] } = useListDocuments();
  
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Knowledge Base
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map(doc => (
          <Card key={doc.id} className="p-6 bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium line-clamp-1">{doc.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] uppercase">{doc.type}</Badge>
                  <Badge variant="secondary" className="text-[10px] uppercase">{doc.source}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
