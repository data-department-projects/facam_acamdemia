import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Select } from '@base-ui/react/select';

type SelectOption = {
  readonly label: string;
  readonly value: string;
};

type Select1Props = {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
  readonly triggerClassName?: string;
  readonly popupClassName?: string;
};

const Select1 = ({
  value,
  onValueChange,
  options,
  placeholder = 'Sélectionner',
  triggerClassName,
  popupClassName,
}: Select1Props) => {
  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(nextValue) => {
        onValueChange(nextValue ?? '');
      }}
    >
      <Select.Trigger
        className={[
          'group flex h-10 min-w-44 items-center justify-between gap-3 rounded-lg border-2 border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-facam-blue data-[popup-open]:border-facam-blue data-[popup-open]:bg-facam-blue-tint/40',
          triggerClassName ?? '',
        ].join(' ')}
      >
        <Select.Value
          className="truncate data-[placeholder]:text-gray-400"
          placeholder={placeholder}
        />
        <Select.Icon className="text-gray-500 transition-colors group-data-[popup-open]:text-facam-blue">
          <ChevronsUpDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className="z-50 outline-none">
          <Select.Popup
            className={[
              'w-max min-w-[var(--anchor-width)] max-w-[min(90vw,28rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl',
              popupClassName ?? '',
            ].join(' ')}
          >
            <Select.List className="max-h-72 overflow-y-auto py-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value || '__empty__'}
                  value={option.value}
                  className="grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2.5 py-2 text-sm text-facam-blue outline-none transition-colors data-[highlighted]:bg-facam-blue data-[highlighted]:text-white"
                >
                  <Select.ItemIndicator className="text-current">
                    <Check className="size-3.5" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="whitespace-nowrap">{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

export default Select1;
