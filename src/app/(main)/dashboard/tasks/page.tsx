import TasksClient from './tasks-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tareas',
  description: 'Organiza las tareas del hogar, asigna responsables, configura quehaceres recurrentes y mantén un seguimiento del orden de tu casa.',
};

export default function TasksPage() {
  return <TasksClient />;
}
