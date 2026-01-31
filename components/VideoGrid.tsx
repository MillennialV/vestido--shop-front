import React from 'react';
import type { Garment } from '@/interfaces/Garment';
import VideoCard from './VideoCard';

interface VideoGridProps {
  garments: Garment[];
  onSelectGarment: (garment: Garment) => void;
  isAdmin: boolean;
  onEdit: (garment: Garment) => void;
  onDelete: (id: number) => void;
  isSelectionMode: boolean;
  selectedIds: Set<number>;
  onToggleSelection: (id: number) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ garments, onSelectGarment, isAdmin, onEdit, onDelete, isSelectionMode, selectedIds, onToggleSelection }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
      {garments.map((garment) => (
        <VideoCard
          key={garment.id}
          garment={garment}
          onSelect={onSelectGarment}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelectionMode={isSelectionMode}
          isSelected={selectedIds.has(garment.id)}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
};

export default VideoGrid;