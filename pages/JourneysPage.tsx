
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useJourneys } from '../contexts/JourneyContext';
import { Journey } from '../types';
import { calculateJourney, formatMinutesToHours } from '../lib/utils';
import Skeleton from '../components/ui/Skeleton';
import JourneyFormModal from '../components/JourneyFormModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Plus, Edit2, Trash2, Filter, ArrowDownUp, Clock, ListX } from 'lucide-react';

const JourneyItem: React.FC<{ journey: Journey, onEdit: (j: Journey) => void, onDelete: (id: string) => void }> = ({ journey, onEdit, onDelete }) => {
    const { settings } = useJourneys();
    if (!settings) return null;

    const calcs = calculateJourney(journey, settings);
    const journeyDate = new Date(journey.date + 'T00:00:00');
    const dayOfWeek = journeyDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    const day = journeyDate.getDate();

    return (
        <div className="bg-white rounded-2xl shadow-soft p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="text-center w-12">
                        <p className="text-xs text-muted-foreground">{dayOfWeek}</p>
                        <p className="text-xl font-bold text-primary-dark">{day}</p>
                    </div>
                    <div>
                        <p className={`font-bold ${journey.isFeriado ? 'text-yellow-600' : 'text-primary-dark'}`}>
                            {journey.isFeriado ? 'Feriado' : 'Dia Normal'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{journey.startAt} - {journey.endAt}</span>
                        </div>
                    </div>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => onEdit(journey)} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(journey.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs bg-primary-light/50 p-2 rounded-lg">
                <div>
                    <p className="font-bold text-primary-dark">{formatMinutesToHours(calcs.totalTrabalhado)}</p>
                    <p className="text-muted-foreground">Trabalhado</p>
                </div>
                <div>
                    <p className="font-bold text-green-600">{formatMinutesToHours(calcs.horasExtras50)}</p>
                    <p className="text-muted-foreground">Extra 50%</p>
                </div>
                <div>
                    <p className="font-bold text-yellow-600">{formatMinutesToHours(calcs.horasExtras100)}</p>
                    <p className="text-muted-foreground">Extra 100%</p>
                </div>
                {settings.kmEnabled && (
                    <div>
                        <p className="font-bold text-primary-dark">{calcs.kmRodados.toFixed(1)} km</p>
                        <p className="text-muted-foreground">Rodados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const JourneyItemSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-soft p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="text-center w-12">
                    <Skeleton className="h-4 w-8 mx-auto" />
                    <Skeleton className="h-7 w-10 mx-auto mt-1" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="w-4 h-4" />
            </div>
        </div>
        <Skeleton className="h-12 w-full" />
    </div>
);

const JourneysPage: React.FC = () => {
    const { journeys, loading, deleteJourney, settings } = useJourneys();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJourney, setEditingJourney] = useState<Journey | undefined>(undefined);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [journeyToDelete, setJourneyToDelete] = useState<string | null>(null);

    const location = useLocation();
    const navigate = useNavigate();
    
    const [filterPeriod, setFilterPeriod] = useState<'current_month' | 'last_7_days' | 'all'>('current_month');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_hours_desc' | 'extra_hours_desc'>('date_desc');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('new') === 'true') {
            setEditingJourney(undefined);
            setIsFormOpen(true);
            // Limpa o parâmetro da URL
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const filteredAndSortedJourneys = useMemo(() => {
        if (!settings) return [];

        let filtered = [...journeys];

        // 1. Filtragem por período
        const now = new Date();
        if (filterPeriod === 'current_month') {
            const startDay = settings?.monthStartDay || 1;
            let startDate = new Date(now.getFullYear(), now.getMonth(), startDay);
            if (now.getDate() < startDay) {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
            }
            let endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay - 1);
            endDate.setHours(23, 59, 59, 999); 

            filtered = journeys.filter(j => {
                const journeyDate = new Date(j.date + 'T00:00:00');
                return journeyDate >= startDate && journeyDate <= endDate;
            });
        } else if (filterPeriod === 'last_7_days') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            filtered = journeys.filter(j => {
                const journeyDate = new Date(j.date + 'T00:00:00');
                return journeyDate >= sevenDaysAgo;
            });
        }

        // 2. Ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date_asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'total_hours_desc': {
                    const calcA = calculateJourney(a, settings);
                    const calcB = calculateJourney(b, settings);
                    return calcB.totalTrabalhado - calcA.totalTrabalhado;
                }
                case 'extra_hours_desc': {
                    const calcA = calculateJourney(a, settings);
                    const calcB = calculateJourney(b, settings);
                    const totalExtrasA = calcA.horasExtras50 + calcA.horasExtras100;
                    const totalExtrasB = calcB.horasExtras50 + calcB.horasExtras100;
                    return totalExtrasB - totalExtrasA;
                }
                case 'date_desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return filtered;
    }, [journeys, settings, filterPeriod, sortBy]);

    const handleEdit = (journey: Journey) => {
        setEditingJourney(journey);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (id: string) => {
        setJourneyToDelete(id);
        setIsConfirmOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (journeyToDelete) {
            deleteJourney(journeyToDelete);
        }
        setJourneyToDelete(null);
    };
    
    const handleAddNew = () => {
        setEditingJourney(undefined);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-4">
             <JourneyFormModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                journey={editingJourney}
            />
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja deletar esta jornada? Esta ação não pode ser desfeita."
                confirmText="Sim, Deletar"
            />
            <div className="flex justify-between items-center">
                <h1 className="text-title-lg text-primary-dark">Minhas Jornadas</h1>
                <button onClick={handleAddNew} className="bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary-dark transition-transform active:scale-95">
                    <Plus />
                </button>
            </div>
            
            {/* Controles de Filtro e Ordenação */}
            <div className="bg-white p-4 rounded-2xl shadow-soft space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
                    <Filter className="w-4 h-4" />
                    <span>Filtrar Período</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilterPeriod('current_month')} className={`px-3 py-1 text-sm rounded-full transition ${filterPeriod === 'current_month' ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        Mês Contábil
                    </button>
                    <button onClick={() => setFilterPeriod('last_7_days')} className={`px-3 py-1 text-sm rounded-full transition ${filterPeriod === 'last_7_days' ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        Últimos 7 dias
                    </button>
                    <button onClick={() => setFilterPeriod('all')} className={`px-3 py-1 text-sm rounded-full transition ${filterPeriod === 'all' ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        Todos
                    </button>
                </div>
                <div className="border-t pt-4">
                     <div className="flex items-center gap-2 text-sm font-semibold text-primary-dark mb-2">
                        <ArrowDownUp className="w-4 h-4" />
                        <span>Ordenar por</span>
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-dark/50 focus:border-primary-dark transition"
                    >
                        <option value="date_desc">Mais Recentes</option>
                        <option value="date_asc">Mais Antigas</option>
                        <option value="total_hours_desc">Horas Trabalhadas (Maior)</option>
                        <option value="extra_hours_desc">Horas Extras (Maior)</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    <JourneyItemSkeleton />
                    <JourneyItemSkeleton />
                    <JourneyItemSkeleton />
                </div>
            ) : journeys.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl shadow-soft flex flex-col items-center gap-4">
                    <ListX className="w-12 h-12 text-muted-foreground" />
                    <div className="flex flex-col">
                        <p className="font-semibold text-primary-dark">Nenhuma jornada registrada.</p>
                        <p className="text-sm text-muted-foreground mt-1">Clique no botão '+' para adicionar sua primeira jornada.</p>
                    </div>
                    <button onClick={handleAddNew} className="mt-2 bg-accent text-primary-dark font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Jornada
                    </button>
                </div>
            ) : filteredAndSortedJourneys.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl shadow-soft">
                    <p className="text-muted-foreground">Nenhuma jornada encontrada para os filtros selecionados.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAndSortedJourneys.map(j => (
                       <JourneyItem key={j.id} journey={j} onEdit={handleEdit} onDelete={handleDeleteRequest}/>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JourneysPage;