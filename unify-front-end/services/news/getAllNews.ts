import { supabase } from '@/lib/supabase';
import { NewsDetails } from '@/types/news';

export const getAllNews = async (): Promise<NewsDetails[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('news_details')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch news');
    }

    return (
      data?.map(news => ({
        id: news.id,
        title: news.title,
        description: news.description,
        author: news.author,
        date: news.date,
        content: news.content,
        link: news.link,
        imageLink: news.image_link, // Map DB snake_case to camelCase
      })) || []
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};
