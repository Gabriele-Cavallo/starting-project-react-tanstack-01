import { Link, useNavigate, useParams } from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchEvent, queryClient, updateEvent } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', id],
    queryFn: ({ signal }) => fetchEvent({ signal, id })
  });

  const {mutate} = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;
      await queryClient.cancelQueries({queryKey: ['events', id]});
      const previousEvent = queryClient.getQueriesData(['events', id]);
      queryClient.setQueriesData(['events', id], newEvent);
      return { previousEvent }
    },
    onError: (error, data, context) => {
      queryClient.setQueriesData(['events', id], context.previousEvent);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['events', id]);
    }
  })

  function handleSubmit(formData) {
    mutate({id, event: formData});
    navigate('../')
   }

  function handleClose() {
    navigate('../');
  }

  let content;

  if(isPending){
    content = <div className="center">
      <LoadingIndicator />
    </div>
  }
  if(isError){
    content = <>
      <ErrorBlock title={'Failed to load event'} message={error.info?.message} />
      <div className="form-action">
        <Link to={'../'} className='button'>
          Okay
        </Link>
      </div>
    </>
  }

  if(data){
    content = <EventForm inputData={data} onSubmit={handleSubmit}>
      <Link to="../" className="button-text">
        Cancel
      </Link>
      <button type="submit" className="button">
        Update
      </button>
    </EventForm>
  }

  return (
    <Modal onClose={handleClose}>
     {content}
    </Modal>
  );
}
