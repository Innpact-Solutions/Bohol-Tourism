// Tourism module — Right panel: cluster detail.
// Shows when a cluster is selected. Has counts grid, anchors / secondaries / premium lists,
// photo gallery, barangay coverage bars, interventions block.

import React, { useState, useMemo } from 'react';
import { X, Star } from 'lucide-react';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';
import { PhotoLightbox } from './PhotoGallery';
import { TOURISM_INTERVENTIONS, TOURISM_INTERVENTIONS_BY_CLUSTER } from '../config/tourismConfig';

const TIER_BG: Record<string, string> = {
  Primary:   TIER_COLORS.Primary.stroke,   // #E07A18 amber
  Emerging:  TIER_COLORS.Emerging.stroke,  // #059669 emerald
  Satellite: TIER_COLORS.Satellite.stroke, // #2563EB blue
};

export function TourismDetailPanel() {
  const { clusters, getMembershipFor, getPhotosFor, sites } = useTourismData();
  const ui = useTourismUI();
  const [lb, setLb] = useState<{ open: boolean; photos: string[]; idx: number; caption: string }>({
    open: false, photos: [], idx: 0, caption: '',
  });

  const cluster = clusters?.features.find((f: any) => f.properties.cluster_id === ui.selectedClusterId);
  const mem = ui.selectedClusterId != null ? getMembershipFor(ui.selectedClusterId) : undefined;

  // Build a flat photo gallery from all anchor + secondary destinations in this cluster
  const gallery = useMemo(() => {
    if (!mem || !sites) return [] as Array<{ url: string; siteName: string }>;
    const named = [...(mem.anchors || []), ...(mem.secondary || [])];
    const items: Array<{ url: string; siteName: string }> = [];
    named.forEach((d) => {
      // Match site by name + LGU
      const siteFeat = sites.features.find((f: any) =>
        f.properties.name === d.name && f.properties.lgu === d.lgu
      );
      const uid = (siteFeat?.properties as any)?.uid;
      const photos = getPhotosFor(uid);
      photos.forEach((url) => items.push({ url, siteName: d.name }));
    });
    return items;
  }, [mem, sites, getPhotosFor]);

  if (!cluster || !mem) {
    return null; // panel closed when nothing selected
  }
  const p: any = cluster.properties;
  const landKm2 = p.area_land ?? p.area_km2;
  const waterKm2 = p.area_water;
  const interventions =
    TOURISM_INTERVENTIONS_BY_CLUSTER[p.cluster_id as number]?.items ??
    (TOURISM_INTERVENTIONS[p.tier] || TOURISM_INTERVENTIONS.Satellite);

  const close = () => ui.setSelectedClusterId(null);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[420px] bg-stone-100 border-l border-stone-300 overflow-y-auto z-[1000] shadow-[-8px_0_24px_rgba(31,39,56,0.08)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-stone-100 px-6 pt-6 pb-5 border-b border-stone-300">
        <button onClick={close} className="absolute top-3 right-4 text-stone-500 hover:text-slate-900 transition-colors">
          <X className="w-6 h-6"/>
        </button>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-block px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-stone-50"
            style={{ background: TIER_BG[p.tier] || '#888' }}
          >
            {p.tier}
          </span>
          {p.priority && (
            <span className="font-serif font-semibold text-[11px] text-stone-700 tracking-wide">
              · Priority P{p.priority}
            </span>
          )}
        </div>
        <h2 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-slate-900">
          {p.name}
        </h2>
        <div className="mt-2.5 font-mono text-[10.5px] uppercase tracking-widest text-stone-500">
          {p.lgu} · {landKm2.toFixed(2)} km² land
          {mem.potential_score != null && ` · Potential ${mem.potential_score.toFixed(1)}`}
        </div>
      </div>

      {/* Counts grid */}
      <div className="px-6 py-4 border-b border-stone-300">
        <div className="grid grid-cols-3 gap-0">
          {[
            { n: p.n_anchor, l: 'Anchors' },
            { n: p.n_sec,    l: 'Secondary' },
            { n: p.n_supp,   l: 'Supportive' },
            { n: p.n_prem,   l: 'Premium' },
            { n: p.n_qual,   l: 'Quality' },
            { n: landKm2.toFixed(2), l: 'Land km²' },
          ].map((s, i) => (
            <div
              key={i}
              className={`text-center py-3 ${i % 3 !== 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''} border-stone-300`}
            >
              <div className="font-serif text-[26px] font-medium leading-none tracking-tight text-slate-900">{s.n}</div>
              <div className="text-[9.5px] uppercase tracking-[0.18em] text-stone-500 mt-1.5">{s.l}</div>
            </div>
          ))}
        </div>
        {waterKm2 != null && waterKm2 >= 0.1 && (
          <div className="mt-3.5 px-3 py-2 border-l-[3px] border-cyan-800 bg-cyan-800/8 text-[11.5px] text-stone-700 font-mono">
            <strong className="text-cyan-800">Marine area:</strong> {waterKm2.toFixed(2)} km² ({p.pct_water}% of polygon)
          </div>
        )}
      </div>

      {/* Lists */}
      {mem.anchors.length > 0 && (
        <Section title="Anchor Destinations">
          <DestList items={mem.anchors} max={11} />
        </Section>
      )}
      {mem.secondary.length > 0 && (
        <Section title="Secondary Destinations">
          <DestList items={mem.secondary} max={12} />
        </Section>
      )}
      {mem.premium && mem.premium.length > 0 && (
        <Section title="Top Premium Hospitality" helper="inside polygon">
          <DestList
            items={[...mem.premium].sort((a, b) => (b.score || 0) - (a.score || 0))}
            max={10}
          />
        </Section>
      )}

      {/* Photo gallery */}
      {gallery.length > 0 && (
        <Section title="Photo Gallery" helper={`${gallery.length} from Google`}>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {gallery.slice(0, 8).map((g, i) => (
              <div
                key={i}
                className="aspect-[4/3] bg-center bg-cover border border-stone-300 cursor-zoom-in hover:scale-[1.02] transition-transform"
                style={{ backgroundImage: `url("${g.url}")` }}
                title={g.siteName}
                onClick={() => setLb({ open: true, photos: gallery.map(x => x.url), idx: i, caption: g.siteName })}
              />
            ))}
          </div>
          {gallery.length > 8 && (
            <div className="text-[9.5px] text-stone-500 italic mt-1.5 leading-snug">
              +{gallery.length - 8} more — click any destination above for full view
            </div>
          )}
          <div className="text-[9.5px] text-stone-500 italic mt-1.5">
            Photos © contributors via Google Places
          </div>
        </Section>
      )}

      {/* Barangay coverage */}
      {mem.barangays && mem.barangays.length > 0 && (
        <Section title="Barangay Coverage" helper="for execution">
          {mem.barangays.map((b, i) => (
            <div key={i} className="my-2">
              <div className="flex justify-between text-[11.5px]">
                <span className="text-slate-900">{b.brgy}</span>
                <span className="font-mono text-[10.5px] text-stone-500">
                  {b.pct}% {b.pop_2024 ? `· pop ${Number(b.pop_2024).toLocaleString()}` : ''}
                </span>
              </div>
              <div className="h-1 bg-stone-200 mt-1">
                <div className="h-full bg-stone-700" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Interventions */}
      <Section title="Recommended Interventions">
        <div
          className="px-4 py-3 mt-1 bg-stone-200 border-l-[3px] text-[12px] text-stone-700"
          style={{ borderLeftColor: TIER_BG[p.tier] || '#888' }}
        >
          <ul className="list-none p-0">
            {interventions.map((line, i) => (
              <li key={i} className="relative pl-4 py-1 leading-snug">
                <span className="absolute left-0 top-1.5 text-[8px]" style={{ color: TIER_BG[p.tier] || '#888' }}>◆</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <PhotoLightbox
        open={lb.open}
        onOpenChange={(open) => setLb((s) => ({ ...s, open }))}
        photos={lb.photos}
        startIndex={lb.idx}
        caption={lb.caption}
      />
    </div>
  );
}

function Section({ title, helper, children }: { title: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-stone-300 last:border-b-0">
      <h4 className="font-serif text-[10.5px] font-semibold uppercase tracking-[0.26em] text-stone-700 mb-3">
        {title}
        {helper && (
          <span className="ml-1.5 font-sans font-normal text-[10.5px] normal-case tracking-normal text-stone-500">
            {helper}
          </span>
        )}
      </h4>
      {children}
    </div>
  );
}

function DestList({ items, max }: { items: any[]; max: number }) {
  return (
    <div className="mt-1">
      {items.slice(0, max).map((x, i) => (
        <div key={i} className="flex justify-between gap-2.5 py-1.5 border-b border-dotted border-stone-300 last:border-b-0 text-[12.5px]">
          <span className="flex-1 text-slate-900 leading-snug">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
              style={{ background: CATEGORY_COLORS[x.cat] || '#888' }}
            />
            {x.name}
          </span>
          <span className="font-mono text-[11px] text-stone-500 whitespace-nowrap">
            {x.score ? <><Star className="inline w-3 h-3 fill-amber-500 text-amber-500 -mt-0.5"/> {x.score.toFixed(1)}</> : '—'}
          </span>
        </div>
      ))}
      {items.length > max && (
        <div className="py-1.5 italic text-[11.5px] text-stone-500">
          …and {items.length - max} more
        </div>
      )}
    </div>
  );
}
