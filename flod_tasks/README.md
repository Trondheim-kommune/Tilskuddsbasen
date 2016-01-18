# flod_tasks

A service for executing tasks. Some of the currently existing tasks are
* sending email asynchronously, using Celery and RabbitMQ.
* uploading information to the Noark arkiv.

## Usage

Every client of this service must have the celery package installed:

`$ pip install celery`

Initialize a Celery app:

```
#!python
from celery import Celery
app = Celery(broker='amqp://guest:guest@localhost:5672//')
```

Add a task to be executed:

```
#!python
app.send_task('celery_tasks.email_tasks.send_email_task',
              kwargs={'subject': 'Emne',
                      'sender': 'tilskudd@trondheim.kommune.no',
                      'recipients': ['monty@python.tld'],
                      'body': 'innhold'})
```

The `send_task` method specifies which method should be invoked by the
Celery worker. In this case, it's the `send_email_task` method in
`celery_tasks.email_tasks`. `kwargs` is passed as arguments to the method.
