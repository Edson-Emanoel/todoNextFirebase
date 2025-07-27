"use client";

import React, { useState, useEffect, useMemo, FC, FormEvent, SVGProps } from 'react';
// Importa a ponte de conexão que criamos
import { db } from '../lib/firebase'; 
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

// --- Definições de Tipo ---
// Define a estrutura de um item da lista
type Item = {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Timestamp; // Tipo específico do Firebase para datas
};

// Define o estado para o item que está sendo editado
type EditingState = {
  id: string | null;
  text: string;
};

// Define o tipo para os filtros possíveis
type FilterType = 'all' | 'active' | 'completed';


// --- Ícones (SVGs com tipagem correta de props) ---
const PlusCircle: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const Edit: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const Trash2: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const X: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// --- Componente Principal ---
const HomePage: FC = () => {
  // --- Estados do Componente (com tipos) ---
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingItem, setEditingItem] = useState<EditingState>({ id: null, text: '' });

  // --- Funções CRUD (com tipos nos parâmetros) ---

  // 1. Adicionar item
  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    if (newItem.trim() !== '') {
      await addDoc(collection(db, 'items'), {
        name: newItem.trim(),
        completed: false,
        createdAt: new Date(), // Firestore converterá para Timestamp
      });
      setNewItem('');
    }
  };

  // 2. Ler itens do Firestore em tempo real
  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsArr: Item[] = [];
      querySnapshot.forEach((doc) => {
        // Assegura que os dados do documento correspondem à estrutura do tipo Item
        const data = doc.data();
        itemsArr.push({
          id: doc.id,
          name: data.name,
          completed: data.completed,
          createdAt: data.createdAt,
        });
      });
      setItems(itemsArr);
    });
    return () => unsubscribe();
  }, []);

  // 3. Atualizar item (marcar como completo/incompleto)
  const toggleComplete = async (id: string, completed: boolean) => {
    await updateDoc(doc(db, 'items', id), { completed: !completed });
  };
  
  // 4. Salvar item editado
  const handleUpdateItem = async (id: string) => {
    if (editingItem.text.trim() !== '') {
      await updateDoc(doc(db, 'items', id), { name: editingItem.text.trim() });
      setEditingItem({ id: null, text: '' });
    }
  };

  // 5. Deletar item
  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'items', id));
  };
  
  // --- Lógica de Filtragem ---
  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'active':
        return items.filter(item => !item.completed);
      case 'completed':
        return items.filter(item => item.completed);
      default: // 'all'
        return items;
    }
  }, [items, filter]);

  // --- Renderização do Componente (JSX) ---
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 bg-slate-900 text-white">
      <div className="z-10 w-full max-w-3xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl sm:text-5xl font-bold p-4 text-center">📝 Lista de Tarefas</h1>
        
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-lg">
          <form onSubmit={addItem} className="flex gap-2 mb-4">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="O que precisa ser feito?"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 rounded-md flex items-center justify-center"
              aria-label="Adicionar Tarefa"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </form>

          <div className="flex justify-center gap-2 mb-6 border-b border-slate-700 pb-4">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}>Todos</button>
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-md ${filter === 'active' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}>Ativos</button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'}`}>Concluídos</button>
          </div>

          <ul>
            {filteredItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4 my-2 bg-slate-900 rounded-lg transition-all duration-300 hover:bg-slate-800/50">
                {editingItem.id === item.id ? (
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      value={editingItem.text}
                      onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(item.id)}
                      className="w-full p-2 bg-slate-700 rounded-md border border-slate-600"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateItem(item.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 rounded-md">Salvar</button>
                    <button onClick={() => setEditingItem({ id: null, text: '' })} className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"><X className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => toggleComplete(item.id, item.completed)}>
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        readOnly
                        className="w-5 h-5 accent-blue-500"
                      />
                      <span className={`text-lg ${item.completed ? 'line-through text-slate-500' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingItem({ id: item.id, text: item.name })} className="p-2 text-slate-400 hover:text-yellow-400 transition-colors" aria-label="Editar">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" aria-label="Deletar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          
          {items.length > 0 && (
            <p className="text-center text-slate-500 mt-6">
              {filteredItems.length} de {items.length} tarefas visíveis.
            </p>
          )}

        </div>
      </div>
    </main>
  );
}

export default HomePage;