"use client";

import { JSX } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DropdownOption {
  label: string;
  value: string;
}

interface TerminalDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function TerminalDropdown({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
}: TerminalDropdownProps): JSX.Element {
  const { isReducedMotion } = useAccessibility();

  return (
    <div className={`relative inline-block w-full sm:w-auto ${className}`}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger 
          className={`w-full sm:min-w-35 ${!isReducedMotion && !disabled ? "hover:scale-[1.02]" : ""}`}
        >
          <SelectValue placeholder="Select option..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
