import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, pdf } from '@react-pdf/renderer';
import { liberation_regular, liberation_bold } from "./fonts";

if (typeof window !== 'undefined') {
  Font.register({
    family: 'Liberation Sans',
    fonts: [
      { src: `data:font/truetype;charset=utf-8;base64,${liberation_regular}` },
      { src: `data:font/truetype;charset=utf-8;base64,${liberation_bold}`, fontWeight: 'bold' }
    ]
  });
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Liberation Sans', backgroundColor: '#ffffff' },
  header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  subtitle: { fontSize: 12, color: '#475569', marginBottom: 5 },
  date: { fontSize: 9, color: '#94a3b8' },
  messageContainer: { marginBottom: 20 },
  sender: { fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  senderUser: { color: '#2563eb' },
  senderSupport: { color: '#0f172a' },
  paragraph: { fontSize: 10, color: '#1e293b', lineHeight: 1.5, marginBottom: 8 },
  codeBlock: { 
    fontFamily: 'Courier', 
    fontSize: 8, 
    color: '#334155', 
    backgroundColor: '#f8fafc', 
    padding: 10,
    marginBottom: 8,
    borderRadius: 4
  },
  divider: { marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  image: { marginVertical: 10, width: '100%' },
  pageNumber: { position: 'absolute', fontSize: 8, bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#94a3b8' }
});

const ChatDocument = ({ messagesWithImages }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>AI10x Business Strategy Report</Text>
        <Text style={styles.subtitle}>Lean Startup Strategy & Design Thinking Insights</Text>
        <Text style={styles.date}>Generated on {new Date().toLocaleString()}</Text>
      </View>
      
      {messagesWithImages.map((msg, i) => (
        <View key={i} style={styles.messageContainer}>
          <Text style={[styles.sender, msg.sender === 'user' ? styles.senderUser : styles.senderSupport]}>
            {msg.sender === 'user' ? 'ENTREPRENEUR' : 'AI10x STRATEGIST'}
          </Text>
          
          {msg.parsedSegments.map((segment, j) => {
            if (segment.type === 'flowchart') {
              return segment.image ? <Image key={j} src={segment.image} style={styles.image} /> : null;
            } else if (segment.type === 'code') {
              return <Text key={j} style={styles.codeBlock}>{segment.content}</Text>;
            } else if (segment.type === 'divider') {
              return <View key={j} style={styles.divider} />;
            } else {
              return segment.content.split('\n\n').filter(p => p.trim()).map((p, k) => (
                <Text key={`${j}-${k}`} style={styles.paragraph}>{p.trim()}</Text>
              ));
            }
          })}
        </View>
      ))}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} fixed />
    </Page>
  </Document>
);

export async function generateChatPDF(messages) {
    if (typeof window === 'undefined') return;

    const html2canvas = require('html2canvas');
    const messageElements = document.querySelectorAll('.message');

    const messagesWithImages = [];
    
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const segments = msg.text.split(/(```[\s\S]*?```|\n---\n|\n\*\*\*\n|\n___\n)/g);
        
        const flowchartContainers = Array.from(messageElements[i]?.querySelectorAll('.flowchart-container') || []);
        let flowchartIdx = 0;
        
        const parsedSegments = [];

        for (const segment of segments) {
            if (!segment || !segment.trim()) continue;

            if (segment.startsWith('```flowchart')) {
                const container = flowchartContainers[flowchartIdx++];
                let image = null;
                if (container) {
                    try {
                        const canvas = await html2canvas(container, { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' });
                        image = canvas.toDataURL('image/png');
                    } catch (e) {
                        console.error("PDF: Flowchart capture failed", e);
                    }
                }
                parsedSegments.push({ type: 'flowchart', image });
            } else if (segment.startsWith('```')) {
                const code = segment.replace(/```\w*\n?/, '').replace(/```$/, '');
                parsedSegments.push({ type: 'code', content: code });
            } else if (segment.match(/^\n?(---|\*\*\*|___)\n?$/)) {
                parsedSegments.push({ type: 'divider' });
            } else {
                const cleanSegment = segment.replace(/[*_#]/g, '').replace(/`/g, '');
                parsedSegments.push({ type: 'text', content: cleanSegment });
            }
        }
        
        messagesWithImages.push({
            sender: msg.sender,
            parsedSegments
        });
    }

    const docBlob = await pdf(<ChatDocument messagesWithImages={messagesWithImages} />).toBlob();
    const url = URL.createObjectURL(docBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "AI10x-Startup-Strategy-Report.pdf";
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}
