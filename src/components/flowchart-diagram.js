import React, { useEffect, useRef } from 'react';
import flowchart from 'flowchart.js';

const FlowchartDiagram = ({ chart }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            try {
                ref.current.innerHTML = '';
                const diagram = flowchart.parse(chart);
                diagram.drawSVG(ref.current, {
                    'x': 0,
                    'y': 0,
                    'line-width': 2,
                    'line-length': 50,
                    'text-margin': 10,
                    'font-size': 14,
                    'font-color': 'black',
                    'line-color': 'black',
                    'element-color': 'black',
                    'fill': 'white',
                    'yes-text': 'yes',
                    'no-text': 'no',
                    'arrow-end': 'block',
                    'scale': 1
                });
            } catch (error) {
                console.error('Failed to render flowchart:', error);
                ref.current.innerHTML = `<pre style="color: red;">Failed to parse flowchart.js code:\\n${chart}</pre>`;
            }
        }
    }, [chart]);

    return <div ref={ref} className="flowchart-container" style={{ margin: '1rem 0', overflowX: 'auto', backgroundColor: 'white', padding: '1rem', borderRadius: '8px' }} />;
};

export default FlowchartDiagram;
