import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

export const formatMessageTime = (date) => {
  if (!date) return '';
  
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else if (isThisWeek(messageDate)) {
    return format(messageDate, 'EEEE');
  } else {
    return format(messageDate, 'dd/MM/yyyy');
  }
};

export const formatLastSeen = (date) => {
  if (!date) return 'Last seen recently';
  
  try {
    return `Last seen ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
  } catch (error) {
    return 'Last seen recently';
  }
};

export const formatFullDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'PPpp');
};

export const getDateSeparator = (date) => {
  if (!date) return '';
  
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return 'Today';
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else {
    return format(messageDate, 'EEEE, MMMM d, yyyy');
  }
};
