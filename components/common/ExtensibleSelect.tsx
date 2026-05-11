import React, { useState, useEffect, useCallback, useContext } from 'react';
import { LocalizationContext } from '../../contexts/LocalizationContext';
import { Language } from '../../types';
import * as referentialsService from '../../services/referentialsService';
import { ReferentialValue } from '../../services/referentialsService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card, CardContent } from '../ui/Card';

export type ReferentialType = 'contact_category' | 'project_type' | 'task_status' | 'programme_type' | 'ticket_issue_type' | string;

interface ExtensibleSelectProps {
  entityType: ReferentialType;
  value: string;
  onChange: (id: string, item: ReferentialValue | null) => void;
  organizationId: string | null;
  /** Si fourni (ex. depuis un parent qui a déjà lu le contexte), évite une dépendance au contexte seul — utile si chunk / arbre atypique. */
  language?: Language;
  canCreate?: boolean;
  canEdit?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const ExtensibleSelect: React.FC<ExtensibleSelectProps> = ({
  entityType,
  value,
  onChange,
  organizationId,
  language: languageProp,
  canCreate = true,
  canEdit = true,
  placeholder,
  label,
  className = '',
  disabled = false,
}) => {
  const loc = useContext(LocalizationContext);
  const language = languageProp ?? loc?.language ?? Language.EN;
  const isFr = language === Language.FR;
  const [options, setOptions] = useState<ReferentialValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await referentialsService.listValues(entityType, organizationId);
      setOptions(list);
    } catch (e: any) {
      setError(e?.message || (isFr ? 'Erreur chargement' : 'Load error'));
    } finally {
      setLoading(false);
    }
  }, [entityType, organizationId, isFr]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === '__create__') {
      setShowCreateModal(true);
      setNewName('');
      return;
    }
    const item = options.find((o) => o.id === v) || null;
    onChange(v, item);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !canCreate) return;
    setCreating(true);
    setError(null);
    try {
      const created = await referentialsService.createValue({
        referentialType: entityType,
        organizationId,
        name,
      });
      await loadOptions();
      onChange(created.id, created);
      setShowCreateModal(false);
      setNewName('');
    } catch (e: any) {
      setError(e?.message || (isFr ? 'Erreur création' : 'Create error'));
    } finally {
      setCreating(false);
    }
  };

  const displayLabel = label || (isFr ? 'Catégorie' : 'Category');
  const createOptionLabel = isFr ? '— Créer / Créer et modifier —' : '— Create / Create and edit —';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{displayLabel}</label>
      )}
      <Select
        value={value}
        onChange={handleSelectChange}
        disabled={disabled || loading}
      >
        <option value="">{placeholder || (isFr ? '— Choisir —' : '— Select —')}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
        {canCreate && (
          <option value="__create__">{createOptionLabel}</option>
        )}
      </Select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4 font-coya">
          <Card className="w-full max-w-sm border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.30)]">
            <CardContent className="p-5">
              <h3 className="font-semibold text-white">
                {isFr ? 'Créer et enregistrer' : 'Create and save'}
              </h3>
              <div className="mt-4">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isFr ? 'Nom' : 'Name'}
                  className="bg-white/90 border-white/15 focus:border-white/30 focus:ring-white/10"
                  autoFocus
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewName('');
                    setError(null);
                  }}
                >
                  {isFr ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? (isFr ? 'Création…' : 'Creating…') : (isFr ? 'Enregistrer' : 'Save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExtensibleSelect;
