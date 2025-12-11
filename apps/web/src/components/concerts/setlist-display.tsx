'use client';

import { Setlist } from '@encore/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface SetlistDisplayProps {
  setlist: Setlist | null;
  className?: string;
}

export function SetlistDisplay({ setlist, className = '' }: SetlistDisplayProps) {
  if (!setlist || !setlist.songs || setlist.songs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Setlist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No setlist available for this concert.</p>
        </CardContent>
      </Card>
    );
  }

  // Group songs by encore status
  const mainSet = setlist.songs.filter(song => !song.encore);
  const encoreSet = setlist.songs.filter(song => song.encore);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          Setlist
          {setlist.setlistFmId && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (via setlist.fm)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Set */}
          {mainSet.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Main Set</h4>
              <ol className="space-y-2">
                {mainSet.map((song, index) => (
                  <li
                    key={`main-${index}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="flex-shrink-0 w-6 text-gray-400 font-medium">
                      {song.position}.
                    </span>
                    <span className="flex-1 text-gray-900">{song.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Encore */}
          {encoreSet.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-purple-700 mb-3">Encore</h4>
              <ol className="space-y-2">
                {encoreSet.map((song, index) => (
                  <li
                    key={`encore-${index}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="flex-shrink-0 w-6 text-purple-400 font-medium">
                      {song.position}.
                    </span>
                    <span className="flex-1 text-gray-900 font-medium">{song.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            Total songs: {setlist.songs.length}
            {encoreSet.length > 0 && ` (${mainSet.length} + ${encoreSet.length} encore)`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
