import { AllContentBlock } from "@/types/content";
import { CodeComponent } from "./code-block";
import { DifficultyComponent } from "./difficulty-block";
import { ExplainationComponent } from "./explaination-block";
import { ExampleComponent } from "./example-block";
import { ImageComponent } from "./image-block";
import React from "react";
import { RelatedTopicsComponent } from "./related-topics-block";
import { SummaryComponent } from "./summary-block";
import { TitleComponent } from "./header-block";

//Registry
const BLOCK_REGISTRY: Record<string, React.FC<any>> = {
  header: TitleComponent,
  difficulty: DifficultyComponent,
  summary: SummaryComponent,
  code: CodeComponent,
  image: ImageComponent,
  //TODO : Adding Diagram Component after completing it in content.ts.
  explaination: ExplainationComponent,
  example: ExampleComponent,
  related_topics: RelatedTopicsComponent,
};

interface BlockRendererProps {
  block: AllContentBlock[];
}

export function BlockRenderer({ block }: BlockRendererProps) {
  // Check if block is present or not
  if (!block || block.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col text-center">
          <h1 className="pb-8 text-2xl">
            No content available right now. Check back soon😓!
          </h1>
          <h2 className="text-xl">Working on it</h2>
          <img
            src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTB4ZDVvcWllaTl5czV5Zzh2azg5aDAyeTQxaWc3a2xjN3Bzb3NkciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JIX9t2j0ZTN9S/giphy.gif"
            alt="Catworking"
            className="h-75 w-100 items-center mx-auto"
          />
        </div>
      </main>
    );
  }
  
  return <></>;
}
