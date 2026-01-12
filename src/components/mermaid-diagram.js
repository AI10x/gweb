import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
});

const MermaidDiagram = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            mermaid.contentLoaded();
            // Use a unique ID for each diagram
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            ref.current.innerHTML = `<div class="mermaid" id="${id}">${chart}</div>`;
            mermaid.init(undefined, ref.current.getElementsByClassName('mermaid'));
        }
    }, [chart]);

    return <div key={chart} ref={ref} className="mermaid-container" style={{ margin: '1rem 0' }} />;
};

export default MermaidDiagram;
