import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Trash2, Plus, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { data: tasks = [], isLoading } = useListTasks();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    createTask.mutate({
      data: { title: newTaskTitle, priority: newTaskPriority, tags: [] }
    }, {
      onSuccess: () => {
        setNewTaskTitle("");
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Directive added" });
      }
    });
  };

  const handleUpdateStatus = (id: string, status: any) => {
    updateTask.mutate({
      taskId: id,
      data: { status }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate({ taskId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const columns = [
    { id: "pending", label: "Pending" },
    { id: "in_progress", label: "In Progress" },
    { id: "done", label: "Completed" },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-primary" />
          Directives
        </h1>
      </div>

      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
        <form onSubmit={handleCreate} className="flex gap-4">
          <Input 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Assign new directive..." 
            className="flex-1 bg-background"
            disabled={createTask.isPending}
          />
          <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={createTask.isPending || !newTaskTitle.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Assign
          </Button>
        </form>
      </Card>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {columns.map(col => (
          <Card key={col.id} className="bg-card/30 backdrop-blur-md border-border/50 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border/50 font-semibold uppercase tracking-wider text-sm flex items-center justify-between">
              {col.label}
              <Badge variant="secondary" className="font-mono">
                {tasks.filter(t => t.status === col.id).length}
              </Badge>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="group bg-background border border-border/50 rounded-lg p-3 shadow-sm hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm leading-tight">{task.title}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(task.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={
                        task.priority === 'urgent' ? 'destructive' : 
                        task.priority === 'high' ? 'default' : 
                        task.priority === 'medium' ? 'secondary' : 'outline'
                      } className="text-[10px] uppercase">
                        {task.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {task.priority}
                      </Badge>
                      
                      <Select value={task.status} onValueChange={(v) => handleUpdateStatus(task.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-[120px] border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        ))}
      </div>
    </div>
  );
}
