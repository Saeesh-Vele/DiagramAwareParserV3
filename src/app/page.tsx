"use client";

import { useState, useRef } from "react";
import { Upload, FileType, CheckCircle2, FileJson, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Step = "upload" | "processing" | "results" | "download";

export default function DiagramParserApp() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultJson, setResultJson] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    setFile(selectedFile);
    processFile(selectedFile);
  };

  const processFile = async (fileToProcess: File) => {
    setCurrentStep("processing");
    setProgress(0);

    // Simulated progress updates for better UX during long process
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 1000);

    try {
      const formData = new FormData();
      formData.append("file", fileToProcess);

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process PDF");
      }

      const data = await response.json();
      setResultJson(data);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => setCurrentStep("results"), 500);
    } catch (error) {
      console.error(error);
      alert("An error occurred during processing.");
      setCurrentStep("upload");
      setFile(null);
      clearInterval(progressInterval);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(resultJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parsed-${file?.name.replace(".pdf", "") || "document"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCurrentStep("download");
  };

  const resetApp = () => {
    setFile(null);
    setResultJson(null);
    setCurrentStep("upload");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 inset-x-0 h-full w-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-16 relative z-10 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 backdrop-blur-md">
            <FileType className="w-6 h-6 text-indigo-400 mr-2" />
            <span className="font-medium text-indigo-200 tracking-wide text-sm">Diagram Aware PDF Parser V3</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400">
            Intelligent Exam Digitization
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Upload engineering exam papers. We automatically extract questions, preserve hierarchy, and understand complex diagrams like electrical circuits.
          </p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto">
          {currentStep === "upload" && (
            <Card 
              className={`border-2 border-dashed bg-slate-900/50 backdrop-blur-xl transition-all duration-300 ease-out hover:bg-slate-900/80 ${isDragging ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]" : "border-slate-800"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
                  <Upload className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Upload Exam PDF</h3>
                <p className="text-slate-400 mb-8 max-w-md">
                  Drag and drop your engineering exam paper here, or click to browse files.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 rounded-xl text-lg font-medium shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all"
                >
                  Select Document
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === "processing" && (
            <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardContent className="py-16 px-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <Loader2 className="w-6 h-6 mr-3 text-indigo-400 animate-spin" />
                      Processing Document
                    </h3>
                    <p className="text-slate-400">Extracting text, detecting diagrams, and analyzing structure...</p>
                  </div>
                  <div className="text-3xl font-light text-indigo-300">
                    {Math.round(progress)}%
                  </div>
                </div>
                <Progress value={progress} className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-full transition-transform duration-500 ease-out" />
                </Progress>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    "Classifying PDF structure",
                    "Extracting structural text",
                    "Running OCR fallback",
                    "Identifying question hierarchy",
                    "Detecting diagram regions",
                    "Understanding electrical components",
                    "Associating diagrams with questions"
                  ].map((task, i) => (
                    <div key={i} className={`flex items-center text-sm ${progress > (i * 12) ? "text-indigo-300" : "text-slate-600"} transition-colors duration-500`}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {task}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "results" && (
            <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <CardContent className="py-12 px-10 text-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Analysis Complete</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
                  Successfully extracted {(resultJson?.questions as unknown[])?.length || 0} questions and detected diagrams.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={resetApp}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-6"
                  >
                    Process Another
                  </Button>
                  <Button 
                    onClick={downloadJson}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 rounded-xl font-medium shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  >
                    <FileJson className="w-5 h-5 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "download" && (
            <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl animate-in fade-in duration-500">
              <CardContent className="py-16 px-10 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Download Started!</h3>
                <p className="text-slate-400 mb-8">Your JSON file containing the extracted questions and diagram data has been downloaded.</p>
                <Button 
                  onClick={resetApp}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Process Another Document
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
