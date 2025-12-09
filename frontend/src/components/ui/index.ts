// ============================================
// ANIMATION WRAPPERS
// ============================================
export { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight } from './FadeIn';
export {
  StaggerContainer,
  StaggerItem,
  StaggerList,
  StaggerListItem,
  StaggerGrid,
} from './StaggerContainer';
export {
  PageTransition,
  AnimatePresenceWrapper,
  SlideTransition,
  ScaleTransition,
  CollapseTransition,
  FadeTransition,
} from './PageTransition';

// ============================================
// CORE COMPONENTS
// ============================================
export { Button, IconButton } from './Button';
export { Input, Textarea, SearchInput } from './Input';
export { Select, NativeSelect } from './Select';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
} from './Card';
export {
  Badge,
  StatusBadge,
  CountBadge,
  DotIndicator,
} from './Badge';

// ============================================
// DATA DISPLAY
// ============================================
export {
  Table,
  SimpleTable,
  TableActions,
  TableCellText,
  TableCellWithAvatar,
} from './Table';
export {
  Skeleton,
  TextSkeleton,
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  ListSkeleton,
  FormSkeleton,
  AvatarSkeleton,
  GridSkeleton,
} from './Skeleton';
export {
  AnimatedNumber,
  AnimatedCurrency,
  AnimatedPercentage,
  Counter,
  AnimatedValueWithTrend,
} from './AnimatedNumber';

// ============================================
// FEEDBACK
// ============================================
export { Tooltip, SimpleTooltip, TooltipTrigger } from './Tooltip';
export {
  Alert,
  AlertWithActions,
  InlineAlert,
  DismissibleAlert,
} from './Alert';
export {
  ConfirmDialog,
  DeleteConfirmDialog,
  LogoutConfirmDialog,
  SaveChangesConfirmDialog,
} from './ConfirmDialog';

// ============================================
// OVERLAYS
// ============================================
export { Modal, ModalWithFooter, Drawer } from './Modal';

// ============================================
// FORM COMPONENTS
// ============================================
export {
  FormField,
  FormLabel,
  FormError,
  FormHelper,
  Checkbox,
  RadioGroup,
  Switch,
  PasswordInput,
  CharacterCounter,
  ValidatedInput,
} from './FormField';
export {
  CurrencyInput,
  PercentageInput,
  NumberInput,
} from './CurrencyInput';
export {
  PhoneInput,
  CpfInput,
  CepInput,
} from './PhoneInput';
export {
  DatePicker,
  TimePicker,
  DateTimePicker,
  DateRangePicker,
} from './DateTimePicker';
export {
  MultiSelect,
  SearchableSelect,
  Combobox,
} from './MultiSelect';
export type { SelectOption } from './MultiSelect';
export {
  FormStepsProvider,
  StepperIndicator,
  VerticalStepper,
  StepProgressBar,
  StepContent,
  StepNavigation,
  StepPanel,
  useFormSteps,
} from './FormSteps';

// ============================================
// EXISTING COMPONENTS
// ============================================
export { LoadingSpinner, PageLoading } from './LoadingSpinner';
export { EmptyState } from './EmptyState';
