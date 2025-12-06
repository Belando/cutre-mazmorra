import React from 'react';
import { motion } from 'framer-motion';
import { Skull, RotateCcw, Trophy, Footprints, Sword, Coins } from 'lucide-react';
import { Button } from '../ui/button';

export default function GameOver({ stats, onRestart }) {
  const handleRestart = () => {
    // Call the restart handler which resets all state
    if (onRestart) {
      onRestart();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm p-6 text-center border bg-slate-900 rounded-2xl border-slate-700"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20"
        >
          <Skull className="w-8 h-8 text-red-500" />
        </motion.div>
        
        <h2 className="mb-1 text-2xl font-bold text-white">Has Muerto</h2>
        <p className="mb-6 text-sm text-slate-400">Tu aventura termina aquí...</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Footprints} label="Piso Máximo" value={stats?.maxLevel || 1} />
          <StatCard icon={Trophy} label="Nivel" value={stats?.playerLevel || 1} />
          <StatCard icon={Sword} label="Enemigos" value={stats?.kills || 0} />
          <StatCard icon={Coins} label="Oro" value={stats?.gold || 0} />
        </div>
        
        <Button 
          onClick={handleRestart}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Intentar de Nuevo
        </Button>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-lg bg-slate-800/50">
      <Icon className="w-4 h-4 mx-auto mb-1 text-slate-400" />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}