# -*- coding: utf-8 -*-
"""empty message

Revision ID: df2bf3734af
Revises: 3bb6a9c8e275
Create Date: 2015-09-11 13:03:09.652935

"""

# revision identifiers, used by Alembic.
from sqlalchemy.dialects.postgresql import ENUM

revision = 'df2bf3734af'
down_revision = '3bb6a9c8e275'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    ENUM(name="standardtekst_types").drop(op.get_bind(), checkfirst=True)
    new_types_enum = sa.Enum('Andre opplysninger',
                             u'Merk følgende', name='standardtekst_types')
    new_types_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('standardtekst', sa.Column('type', new_types_enum, nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('standardtekst', 'type')
    ENUM(name="standardtekst_types").drop(op.get_bind(), checkfirst=False)
    ### end Alembic commands ###
