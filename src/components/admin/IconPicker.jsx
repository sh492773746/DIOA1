import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const IconPicker = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const isIconComponent = (key) => {
    const component = LucideIcons[key];
    // A more robust check for a valid React component from lucide-react
    return (
      typeof component === 'object' &&
      component.$$typeof === Symbol.for('react.forward_ref') && // Lucide icons are forwardRef components
      /^[A-Z]/.test(key) && // Conventionally, components start with an uppercase letter
      key !== 'LucideIcon' &&
      key !== 'createLucideIcon'
    );
  };

  const filteredIcons = useMemo(() => {
    const iconKeys = Object.keys(LucideIcons).filter(isIconComponent);
    if (!search) {
      return iconKeys;
    }
    return iconKeys.filter(key => 
      key.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const SelectedIcon = value && LucideIcons[value] ? LucideIcons[value] : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start", !value && "text-muted-foreground", "border border-border")}>
          {SelectedIcon ? (
            <div className="flex items-center">
              <SelectedIcon className="mr-2 h-4 w-4 text-foreground" />
              <span className="text-foreground">{value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">选择图标</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-background border border-border">
        <div className="p-2">
          <Input
            placeholder="搜索图标..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border text-foreground"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 grid grid-cols-5 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = LucideIcons[iconName];
              return (
                <Button
                  key={iconName}
                  variant="ghost"
                  size="icon"
                  className={cn("w-full h-12 text-muted-foreground", value === iconName && "bg-accent text-accent-foreground")}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  <IconComponent className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;