import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { 
  FaMagnifyingGlass, 
  FaRotate, 
  FaSliders, 
  FaRobot, 
  FaBoltLightning, 
  FaDiagramProject, 
  FaXmark,
  FaCheck,
  FaCapsules,
  FaDna,
  FaDisease,
  FaAtom,
  FaFlask
} from 'react-icons/fa6';
import { fetchNodes, fetchEdges } from '../services/api';

export default function GraphCanvas({ onOpenCopilot, onRunSimulation }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [selectedTypes, setSelectedTypes] = useState({
    Drug: true,
    Gene: true,
    Protein: true,
    Disease: true,
    Entity: true
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, node }

  const loadGraphData = async () => {
    if (!containerRef.current) return;
    setLoading(true);
    try {
      const nodesData = await fetchNodes({ limit: 1000 });
      const edgesData = await fetchEdges({ limit: 2000 });

      // Build node ID set to filter out orphaned edges with non-existent source or target
      const validNodeIds = new Set(nodesData.map(n => n.id));
      const validEdges = edgesData.filter(
        e => validNodeIds.has(e.source_node_id) && validNodeIds.has(e.target_node_id)
      );

      const elements = [
        ...nodesData.map(n => ({
          data: {
            id: n.id,
            label: n.canonical_name,
            type: n.entity_type
          }
        })),
        ...validEdges.map(e => ({
          data: {
            id: e.id,
            source: e.source_node_id,
            target: e.target_node_id,
            label: e.predicate,
            confidence: e.confidence_score,
            evidence: e.evidence_snippet
          }
        }))
      ];

      if (!containerRef.current) return;

      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (ele) => {
                const type = ele.data('type');
                if (type === 'Drug') return '#10b981';
                if (type === 'Gene') return '#3b82f6';
                if (type === 'Protein') return '#8b5cf6';
                if (type === 'Disease') return '#ef4444';
                return '#6366f1';
              },
              'label': 'data(label)',
              'color': '#f8fafc',
              'font-size': '11px',
              'font-weight': 'bold',
              'text-valign': 'center',
              'text-halign': 'center',
              'width': 50,
              'height': 50,
              'border-width': 2,
              'border-color': '#ffffff',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#475569',
              'target-arrow-color': '#475569',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '9px',
              'color': '#94a3b8',
              'text-background-opacity': 0.8,
              'text-background-color': '#0f172a',
              'text-background-padding': '3px'
            }
          },
          {
            selector: ':selected',
            style: {
              'border-width': 4,
              'border-color': '#f59e0b',
              'line-color': '#f59e0b',
              'target-arrow-color': '#f59e0b'
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          padding: 30
        }
      });

      cy.on('tap', 'node, edge', (evt) => {
        setSelectedElement(evt.target.data());
        setContextMenu(null);
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedElement(null);
          setContextMenu(null);
        }
      });

      // Right-Click Context Menu on Nodes
      cy.on('cxttap', 'node', (evt) => {
        const nodeData = evt.target.data();
        const renderedPos = evt.renderedPosition;
        setContextMenu({
          x: renderedPos.x,
          y: renderedPos.y,
          node: nodeData
        });
      });

      cyRef.current = cy;
    } catch (err) {
      console.error("Failed to load 2D Cytoscape graph data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGraphData();
    }, 100);
    return () => {
      clearTimeout(timer);
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  // Apply Live Filters
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.nodes().forEach(node => {
      const type = node.data('type');
      const label = node.data('label').toLowerCase();

      const typeMatch = selectedTypes[type] !== false;
      const searchMatch = !searchTerm || label.includes(searchTerm.toLowerCase());

      if (typeMatch && searchMatch) {
        node.style('display', 'element');
      } else {
        node.style('display', 'none');
      }
    });

    cy.edges().forEach(edge => {
      const confidence = edge.data('confidence') || 1.0;
      if (confidence >= confidenceThreshold) {
        edge.style('display', 'element');
      } else {
        edge.style('display', 'none');
      }
    });
  }, [searchTerm, confidenceThreshold, selectedTypes]);

  const handleIsolateSubgraph = (nodeId) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const targetNode = cy.getElementById(nodeId);
    if (targetNode) {
      const neighborhood = targetNode.closedNeighborhood();
      cy.elements().not(neighborhood).style('display', 'none');
      neighborhood.style('display', 'element');
    }
    setContextMenu(null);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getTypeBadgeStyle = (type, isChecked) => {
    if (!isChecked) {
      return "bg-slate-900/60 text-slate-500 border border-slate-800/80 hover:border-slate-700 opacity-60";
    }
    switch (type) {
      case 'Drug':
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 font-bold";
      case 'Gene':
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20 font-bold";
      case 'Protein':
        return "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20 font-bold";
      case 'Disease':
        return "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20 font-bold";
      default:
        return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20 font-bold";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Drug': return <FaCapsules className="w-3 h-3 text-emerald-400" />;
      case 'Gene': return <FaDna className="w-3 h-3 text-blue-400" />;
      case 'Protein': return <FaAtom className="w-3 h-3 text-purple-400" />;
      case 'Disease': return <FaDisease className="w-3 h-3 text-red-400" />;
      default: return <FaFlask className="w-3 h-3 text-indigo-400" />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] bg-slate-950 overflow-hidden">
      {/* Floating Filter Control Bar */}
      <div className="absolute top-4 left-4 z-20 glass-panel p-3.5 rounded-2xl border border-slate-800/80 space-y-3.5 text-xs w-84 shadow-2xl bg-slate-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-indigo-300">
            <FaSliders className="w-4 h-4 text-indigo-400" />
            <span>Interactive Graph Filters</span>
          </div>
          <button onClick={loadGraphData} className="p-1 text-slate-400 hover:text-slate-200">
            <FaRotate className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FaMagnifyingGlass className="w-3 h-3 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search entities or relations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Custom Styled Entity Type Chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Entity Types</label>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {Object.keys(selectedTypes).map(type => {
              const isChecked = selectedTypes[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] transition-all duration-150 select-none ${getTypeBadgeStyle(type, isChecked)}`}
                >
                  <span className="flex items-center space-x-1">
                    {getTypeIcon(type)}
                    <span>{type}</span>
                  </span>
                  {isChecked && <FaCheck className="w-2.5 h-2.5 ml-0.5 text-slate-200" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Min Confidence Threshold:</span>
            <span className="text-amber-400 font-bold text-xs">{Math.round(confidenceThreshold * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Cytoscape Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 glass-panel border border-indigo-500/40 rounded-xl shadow-2xl p-1.5 w-48 space-y-1 bg-slate-950/95 backdrop-blur-xl text-xs"
        >
          <div className="px-2 py-1 font-bold text-indigo-300 border-b border-slate-800 truncate">
            {contextMenu.node.label}
          </div>

          <button
            onClick={() => handleIsolateSubgraph(contextMenu.node.id)}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 text-left"
          >
            <FaDiagramProject className="w-3.5 h-3.5 text-indigo-400" />
            <span>Isolate Subgraph</span>
          </button>

          {onRunSimulation && (
            <button
              onClick={() => {
                onRunSimulation(contextMenu.node.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-slate-800 text-left"
            >
              <FaBoltLightning className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Knockout</span>
            </button>
          )}

          {onOpenCopilot && (
            <button
              onClick={() => {
                onOpenCopilot();
                setContextMenu(null);
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-slate-800 text-left"
            >
              <FaRobot className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask AI Copilot</span>
            </button>
          )}
        </div>
      )}

      {/* Sidebar Inspector */}
      {selectedElement && (
        <div className="absolute bottom-6 right-6 z-20 glass-panel p-4 rounded-2xl border border-indigo-500/40 w-80 space-y-2 text-xs bg-slate-950/90 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100">{selectedElement.label || selectedElement.name}</span>
            <button onClick={() => setSelectedElement(null)} className="p-1 text-slate-400 hover:text-slate-200">
              <FaXmark className="w-3.5 h-3.5" />
            </button>
          </div>
          {selectedElement.type && <div className="text-indigo-400 font-medium">Type: {selectedElement.type}</div>}
          {selectedElement.confidence && (
            <div className="text-emerald-400 font-bold">Confidence Score: {Math.round(selectedElement.confidence * 100)}%</div>
          )}
          {selectedElement.evidence && (
            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300 italic text-[11px] leading-relaxed">
              "{selectedElement.evidence}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
