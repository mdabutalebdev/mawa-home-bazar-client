"use client";

import React, { useEffect } from 'react';
import { useGetDivisionsQuery, useGetDistrictsQuery, useGetUpazilasQuery, GeoArea } from '@/redux/api/geoApi';

export interface AreaValue {
    division?: string;
    district?: string;
    upazila?: string;
    /**
     * English names of whatever is currently selected. Emitted alongside the
     * ids because callers almost always need them too — the address book still
     * stores a plain `city`/`area` string for the shipping-rate lookup, and
     * re-fetching two documents just to print a name would be wasteful.
     */
    divisionName?: string;
    districtName?: string;
    upazilaName?: string;
}

interface Props {
    value: AreaValue;
    onChange: (next: AreaValue) => void;
    /** Show Bengali names instead of English. */
    bangla?: boolean;
    /** Only list upazilas that already have an approved dealer. */
    onlyCovered?: boolean;
    required?: boolean;
    disabled?: boolean;
    /** Rendered above the three selects. */
    label?: string;
    className?: string;
}

const selectCls =
    'w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-white outline-none ' +
    'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)] ' +
    'transition-colors disabled:bg-gray-50 disabled:text-gray-400';

/**
 * Cascading Division → District → Upazila picker.
 *
 * Every address in the marketplace is anchored to an upazila (that is how
 * orders find their dealer), so this component is the single place that
 * knowledge lives. Picking a division clears the two below it, picking a
 * district clears the upazila — otherwise a stale child value would quietly
 * survive and route an order to the wrong area.
 */
const AreaSelect: React.FC<Props> = ({
    value,
    onChange,
    bangla = false,
    onlyCovered = false,
    required = false,
    disabled = false,
    label,
    className = '',
}) => {
    const { data: divRes, isLoading: divLoading } = useGetDivisionsQuery(undefined);
    const { data: distRes, isFetching: distLoading } = useGetDistrictsQuery(
        value.division ? { division: value.division } : undefined,
        { skip: !value.division }
    );
    const { data: upaRes, isFetching: upaLoading } = useGetUpazilasQuery(
        value.district ? { district: value.district, ...(onlyCovered ? { hasDealer: true } : {}) } : undefined,
        { skip: !value.district }
    );

    const divisions: GeoArea[] = divRes?.data || [];
    const districts: GeoArea[] = distRes?.data || [];
    const upazilas: GeoArea[] = upaRes?.data || [];

    const nameOf = (a: GeoArea) => (bangla && a.bnName ? a.bnName : a.name);
    const englishName = (list: GeoArea[], id?: string) => list.find((a) => a._id === id)?.name;

    /** Re-attach the English names of whatever the new selection points at. */
    const emit = (next: AreaValue) =>
        onChange({
            ...next,
            divisionName: englishName(divisions, next.division),
            districtName: englishName(districts, next.district),
            upazilaName: englishName(upazilas, next.upazila),
        });

    // A district/upazila that no longer belongs to the chosen parent must not
    // linger — it would submit an inconsistent address.
    useEffect(() => {
        if (value.district && districts.length > 0 && !districts.some((d) => d._id === value.district)) {
            emit({ division: value.division });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [districts]);

    useEffect(() => {
        if (value.upazila && upazilas.length > 0 && !upazilas.some((u) => u._id === value.upazila)) {
            emit({ division: value.division, district: value.district });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [upazilas]);

    return (
        <div className={className}>
            {label && (
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                    aria-label={bangla ? 'বিভাগ' : 'Division'}
                    className={selectCls}
                    disabled={disabled || divLoading}
                    value={value.division || ''}
                    onChange={(e) => emit({ division: e.target.value || undefined })}
                >
                    <option value="">{divLoading ? '…' : bangla ? 'বিভাগ' : 'Division'}</option>
                    {divisions.map((d) => (
                        <option key={d._id} value={d._id}>{nameOf(d)}</option>
                    ))}
                </select>

                <select
                    aria-label={bangla ? 'জেলা' : 'District'}
                    className={selectCls}
                    disabled={disabled || !value.division || distLoading}
                    value={value.district || ''}
                    onChange={(e) =>
                        emit({ division: value.division, district: e.target.value || undefined })
                    }
                >
                    <option value="">{distLoading ? '…' : bangla ? 'জেলা' : 'District'}</option>
                    {districts.map((d) => (
                        <option key={d._id} value={d._id}>{nameOf(d)}</option>
                    ))}
                </select>

                <select
                    aria-label={bangla ? 'উপজেলা' : 'Upazila'}
                    className={selectCls}
                    disabled={disabled || !value.district || upaLoading}
                    value={value.upazila || ''}
                    onChange={(e) =>
                        emit({
                            division: value.division,
                            district: value.district,
                            upazila: e.target.value || undefined,
                        })
                    }
                >
                    <option value="">{upaLoading ? '…' : bangla ? 'উপজেলা' : 'Upazila'}</option>
                    {upazilas.map((u) => (
                        <option key={u._id} value={u._id}>{nameOf(u)}</option>
                    ))}
                </select>
            </div>

            {onlyCovered && value.district && !upaLoading && upazilas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                    {bangla
                        ? 'এই জেলায় এখনো কোনো ডিলার নেই।'
                        : 'No dealer covers this district yet.'}
                </p>
            )}
        </div>
    );
};

export default AreaSelect;
