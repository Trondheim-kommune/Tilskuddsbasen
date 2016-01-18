# -*- coding: utf-8 -*-
"""lagt_til_status_til_klagevedtak

Revision ID: 54e8291ab376
Revises: 3c4fb7864411
Create Date: 2014-11-04 15:36:47.106803

"""

# revision identifiers, used by Alembic.
revision = '54e8291ab376'
down_revision = '3c4fb7864411'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


def upgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum('Kladd',
                              'Innsendt',
                              'Trukket',
                              'Avsluttet',
                              'Under behandling',
                              'Etterspurt info',
                              'Til vedtak',
                              'Vedtak fattet',
                              u'Vedtak påklaget',
                              'Til utbetaling',
                              'Avventer rapport',
                              u'Rapport påbegynt',
                              'Rapport levert',
                              'Tilbakebetaling kreves',
                              'Til klagevedtak', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))


def downgrade():
    op.drop_column('soknader', 'status')
    ENUM(name="soknad_status_types").drop(op.get_bind(), checkfirst=False)
    new_status_enum = sa.Enum('Kladd',
                              'Innsendt',
                              'Trukket',
                              'Avsluttet',
                              'Under behandling',
                              'Etterspurt info',
                              'Til vedtak',
                              'Vedtak fattet',
                              u'Vedtak påklaget',
                              'Til utbetaling',
                              'Avventer rapport',
                              u'Rapport påbegynt',
                              'Rapport levert',
                              'Tilbakebetaling kreves', name='soknad_status_types')
    new_status_enum.create(op.get_bind())
    op.add_column('soknader', sa.Column('status', new_status_enum, nullable=True))
