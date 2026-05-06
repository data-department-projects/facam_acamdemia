import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MissionSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title: string;
  description?: string;
  inputPlaceholder?: string;
  primaryButtonText?: string;
  onPrimaryClick?: (inputValue: string) => void;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  children?: React.ReactNode;
  maxWidthClassName?: string;
}

export const MissionSuccessDialog: React.FC<MissionSuccessDialogProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
  inputPlaceholder = 'Entrer une valeur',
  primaryButtonText,
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick,
  badgeText,
  badgeIcon,
  children,
  maxWidthClassName = 'max-w-2xl',
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const hasImage: boolean = Boolean(imageUrl);
  const hasChildren: boolean = Boolean(children);
  const showDefaultActions: boolean =
    !hasChildren &&
    Boolean(primaryButtonText) &&
    typeof onPrimaryClick === 'function' &&
    Boolean(secondaryButtonText) &&
    typeof onSecondaryClick === 'function';
  React.useEffect(() => {
    if (!isOpen) return;
    setInputValue('');
  }, [isOpen]);
  const handlePrimaryClick = (): void => {
    if (!onPrimaryClick) return;
    onPrimaryClick(inputValue);
    onClose();
  };
  const handleSecondaryClick = (): void => {
    if (!onSecondaryClick) return;
    onSecondaryClick();
    onClose();
  };
  const isFormLayout: boolean = hasChildren && !hasImage;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={`relative z-10 w-full ${maxWidthClassName} max-h-[min(92vh,900px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl`}
          >
            <div
              className={
                isFormLayout ? 'relative p-6 text-left sm:p-8' : 'relative p-8 text-center'
              }
            >
              {badgeText && hasImage ? (
                <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-facam-blue/10 px-3 py-1 text-xs font-semibold text-facam-blue">
                  {badgeIcon}
                  <span>{badgeText}</span>
                </div>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 z-10 h-9 w-9 shrink-0 rounded-full border border-gray-100 bg-white/90 shadow-sm hover:bg-gray-50"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
              {hasImage ? (
                <div className="mx-auto mb-4 mt-10 flex h-44 w-44 items-center justify-center">
                  <Image
                    src={imageUrl as string}
                    alt="Illustration"
                    width={176}
                    height={176}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(59,130,246,0.35)]"
                  />
                </div>
              ) : null}
              <div className={isFormLayout ? 'mb-6 pr-10 pt-1' : hasImage ? '' : 'mb-6'}>
                <h2
                  className={
                    isFormLayout
                      ? 'text-xl font-bold tracking-tight text-facam-dark sm:text-2xl'
                      : 'mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-facam-dark'
                  }
                >
                  {!isFormLayout ? <Zap className="h-5 w-5 text-facam-yellow" /> : null}
                  {title}
                </h2>
                {description ? (
                  <p
                    className={
                      isFormLayout ? 'mt-2 text-sm text-gray-600' : 'text-sm text-gray-500'
                    }
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              {hasChildren ? (
                <div className="space-y-4">{children}</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Input
                    type="text"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-gray-100 text-center"
                  />
                  {showDefaultActions ? (
                    <>
                      <Button onClick={handlePrimaryClick} size="lg" className="w-full">
                        {primaryButtonText}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleSecondaryClick}
                        className="text-gray-500"
                      >
                        {secondaryButtonText}
                      </Button>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
