import React from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TODO from "../components/docs/TODOContent";
import CHANGELOG from "../components/docs/CHANGELOGContent";

export default function Docs() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Project Docs</h1>
        <p className="text-slate-500 mt-1">Live TODO and Changelog for this app.</p>
      </div>

      <Tabs defaultValue="todo">
        <TabsList>
          <TabsTrigger value="todo">TODO</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-4">
          <Card className="rounded-3xl border-slate-200">
            <CardHeader>
              <CardTitle>To‑Do</CardTitle>
              <CardDescription>Incremental plan and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{TODO}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="mt-4">
          <Card className="rounded-3xl border-slate-200">
            <CardHeader>
              <CardTitle>Changelog</CardTitle>
              <CardDescription>Recent changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{CHANGELOG}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}