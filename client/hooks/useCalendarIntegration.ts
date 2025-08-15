// client/hooks/useCalendarIntegration.ts
import { useState, useCallback } from 'react';
import { CalendarEvent, ScheduledPost } from '../types/contentScheduler';

interface CalendarIntegrationHook {
  addPostToCalendar: (post: ScheduledPost) => Promise<void>;
  removePostFromCalendar: (eventId: string) => Promise<void>;
  getCalendarEvents: () => Promise<CalendarEvent[]>;
  updateCalendarEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
}

export const useCalendarIntegration = (): CalendarIntegrationHook => {
  const [isLoading, setIsLoading] = useState(false);

  const addPostToCalendar = useCallback(async (post: ScheduledPost) => {
    if (!post.scheduledDate) return;

    try {
      setIsLoading(true);
      
      const calendarEvent: CalendarEvent = {
        id: `post_${post.id}`,
        title: `📱 Post to ${post.platforms.join(', ')}`,
        description: post.text.slice(0, 100) + (post.text.length > 100 ? '...' : ''),
        date: post.scheduledDate,
        type: 'post',
        postId: post.id,
        platforms: post.platforms
      };

      const response = await fetch('/api/content-scheduler/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent)
      });

      if (!response.ok) {
        throw new Error('Failed to add event to calendar');
      }

      // Also update AIWeeklyPlanner if it has an API
      await updateAIWeeklyPlanner(calendarEvent);
      
    } catch (error) {
      console.error('Error adding post to calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removePostFromCalendar = useCallback(async (eventId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/content-scheduler/calendar/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove event from calendar');
      }

      // Also remove from AIWeeklyPlanner
      await removeFromAIWeeklyPlanner(eventId);
      
    } catch (error) {
      console.error('Error removing post from calendar:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCalendarEvents = useCallback(async (): Promise<CalendarEvent[]> => {
    try {
      const response = await fetch('/api/content-scheduler/calendar/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }, []);

  const updateCalendarEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/content-scheduler/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar event');
      }

      // Also update AIWeeklyPlanner
      await updateAIWeeklyPlannerEvent(eventId, updates);
      
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to update AIWeeklyPlanner
  const updateAIWeeklyPlanner = async (event: CalendarEvent) => {
    try {
      await fetch('/api/ai-weekly-planner/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          type: 'content-post',
          metadata: {
            platforms: event.platforms,
            postId: event.postId
          }
        })
      });
    } catch (error) {
      console.error('Error updating AI Weekly Planner:', error);
    }
  };

  const removeFromAIWeeklyPlanner = async (eventId: string) => {
    try {
      await fetch(`/api/ai-weekly-planner/events/${eventId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing from AI Weekly Planner:', error);
    }
  };

  const updateAIWeeklyPlannerEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      await fetch(`/api/ai-weekly-planner/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating AI Weekly Planner event:', error);
    }
  };

  return {
    addPostToCalendar,
    removePostFromCalendar,
    getCalendarEvents,
    updateCalendarEvent
  };
};