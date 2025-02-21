import React, { useState, useEffect, useRef } from "react";
import ReactMde from "react-mde";
import Footer from "./Navbar/footer";
import Showdown from "showdown";
import { useNavigate } from "react-router-dom";
import "react-mde/lib/styles/css/react-mde-all.css";
import './Editor.css'
import axios from "axios";

const MarkdownEditor = () => {
    const [markdown, setMarkdown] = useState("");
    const [convertedHtml, setConvertedHtml] = useState("");
    const previewRef = useRef(null);
    const navigate = useNavigate();

    const converter = new Showdown.Converter({
        sanitize: true,
        ghCompatibleHeaderId: true,
        tables: true,
        simpleLineBreaks: true,
        strikethrough: true,
        tasklists: true,
        openLinksInNewWindow: true,
    });

    useEffect(() => {
        setConvertedHtml(converter.makeHtml(markdown));
    }, [markdown]);

    const handleUpdate = (text) => {
        setMarkdown(text);
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("User not authenticated!");
            return;
        }
        alert("Notes saved successfully!");
    };

    const handleDownload = () => {
        const blob = new Blob([markdown], { type: "text/markdown" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "markdown_content.md";
        link.click();
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 text-white">
            {/* HEADER */}
            <header className="bg-gray-800 p-4 shadow-lg sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-lg font-bold">Markdown Editor</h1>
                <div className="flex gap-6">
                    <p onClick={() => navigate('/dashboard')} className="cursor-pointer hover:underline">Dashboard</p>
                    <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} className="hover:underline">Log out</button>
                </div>
            </header>

            {/* EDITOR & PREVIEW */}
            <div className="flex flex-col md:flex-row flex-grow gap-6 p-6">
                {/* Editor */}
                <div className="flex-1 bg-gray-700 p-4 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-2">Editor</h3>
                    <ReactMde
                        value={markdown}
                        onChange={handleUpdate}
                        childProps={{ textArea: { style: { height: "400px" } } }}
                    />
                    <div className="flex gap-4 mt-4">
                        <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg shadow-md">Save</button>
                        <button onClick={handleDownload} className="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg shadow-md">Download</button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-gray-200 text-black p-4 rounded-lg shadow-lg overflow-auto">
                    <h3 className="text-xl font-semibold mb-2">Preview</h3>
                    <div className="preview-content" dangerouslySetInnerHTML={{ __html: convertedHtml }}></div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MarkdownEditor;
